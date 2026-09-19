import { detectSignal } from "../identity/signals";
import { sleep } from "../internal/utils";
import { echoesNonce } from "../probes/prompts";
import {
  PROBES,
  type ProbeDef,
  type ProbeLabel,
  type ProbeSignal,
} from "../probes/table";
import type { ProbeOutcome } from "../types";
import { buildChat, callWire, type RunCtx } from "./context";

const NONCE_MISMATCH_RETRIES = 2;
const NONCE_MISMATCH_BACKOFF_MS = 500;
const RESPONSE_CAP = 2000;

const cap = (text: string) =>
  text.length > RESPONSE_CAP ? `${text.slice(0, RESPONSE_CAP)}...` : text;

/** A probe's outcome plus what the rules need but the result never carries. */
export type ProbeEval = ProbeOutcome & {
  text: string | undefined;
  raw: unknown;
  corsBlocked: boolean;
};

export function probeReason(
  pass: boolean,
  signal: ProbeSignal,
  muxFailure: boolean,
  transient: boolean,
): string {
  if (signal === "coding-tool") return "coding-tool wrapper detected";
  if (signal === "scam") return "scam page detected";
  if (signal === "cjk-leak") return "CJK leaked into an English reply";
  if (signal === "foreign") return "foreign vendor named";
  if (signal === "cloud-host") return "cloud host named (accepted)";
  if (signal === "blank") return "blank response";
  if (muxFailure) return "response mixing (nonce mismatch)";
  if (transient) return "transient upstream error";
  return pass ? "passed" : "failed quality check";
}

async function runProbe(
  ctx: RunCtx,
  probe: ProbeDef<ProbeLabel>,
): Promise<ProbeEval> {
  const started = performance.now();
  const base = {
    label: probe.label,
    signal: null,
    muxFailure: false,
    transient: false,
    usage: null,
    detectedModel: null,
    responseText: null,
    httpStatus: null,
    text: undefined,
    raw: null,
    corsBlocked: false,
  } satisfies Partial<ProbeEval>;
  const elapsed = () => Math.round(performance.now() - started);
  let lastPrompt = "";
  let weak: { text: string; raw: unknown; status: number | null } | null = null;

  for (let attempt = 0; attempt <= NONCE_MISMATCH_RETRIES; attempt++) {
    if (attempt > 0) await sleep(NONCE_MISMATCH_BACKOFF_MS);
    const nonce = ctx.nonce();
    lastPrompt = probe.prompt(nonce);
    const built = buildChat(ctx, {
      maxTokens: probe.maxTokens,
      messages: [{ role: "user", content: lastPrompt }],
    });
    const res = await callWire(ctx, built);
    const log = (
      pass: boolean,
      signal: ProbeSignal,
      responseText: string | null,
      error?: string,
    ) =>
      ctx.onProbe?.({
        label: probe.label,
        attempt,
        pass,
        signal,
        request: built,
        responseText,
        ...(error !== undefined ? { error } : {}),
      });

    // No answer, no verdict: only an answered probe can prove a faker. A busy
    // relay reports 400/403/404 as often as 503, and a 403 here once
    // blacklisted an honest lane for good.
    if (res.error !== null || res.status === null || res.status >= 400) {
      log(false, null, null, res.error ?? `HTTP ${res.status}`);
      return {
        ...base,
        pass: false,
        transient: true,
        latencyMs: elapsed(),
        prompt: lastPrompt,
        httpStatus: res.status,
        reason: probeReason(false, null, false, true),
        corsBlocked: res.corsBlocked,
        raw: res.data,
      };
    }

    const text = ctx.wire.read.text(res.data);
    const meta = ctx.wire.read.meta(res.data);
    // An error body at 200 is no answer either.
    if (text === null) {
      log(false, null, null, "upstream error envelope");
      return {
        ...base,
        pass: false,
        transient: true,
        latencyMs: elapsed(),
        prompt: lastPrompt,
        httpStatus: res.status,
        usage: meta.usage,
        detectedModel: meta.detectedModel,
        reason: "upstream error envelope",
        raw: res.data,
      };
    }

    if (!echoesNonce(text, nonce)) {
      log(
        false,
        null,
        text,
        `nonce_mismatch (attempt ${attempt + 1}/${NONCE_MISMATCH_RETRIES + 1}): expected "${nonce}"`,
      );
      if (text.trim().length > 0)
        weak = { text, raw: res.data, status: res.status };
      continue;
    }

    const signal = detectSignal(text, probe.label, ctx.maker);
    const pass = probe.grade(text, ctx.maker);
    log(pass, signal, text);
    return {
      ...base,
      pass,
      signal,
      latencyMs: elapsed(),
      prompt: lastPrompt,
      responseText: cap(text),
      httpStatus: res.status,
      usage: meta.usage,
      detectedModel: meta.detectedModel,
      reason: probeReason(pass, signal, false, false),
      text,
      raw: res.data,
    };
  }

  // The nonce proves the reply belongs to THIS request. Across the log history
  // 169 mismatches were a CORRECT answer from a model that ignored the tag, so
  // a readable reply is still graded, just never trusted for the nonce.
  if (weak) {
    const meta = ctx.wire.read.meta(weak.raw);
    const signal = detectSignal(weak.text, probe.label, ctx.maker);
    const pass = probe.grade(weak.text, ctx.maker);
    return {
      ...base,
      pass,
      signal,
      latencyMs: elapsed(),
      prompt: lastPrompt,
      responseText: cap(weak.text),
      httpStatus: weak.status,
      usage: meta.usage,
      detectedModel: meta.detectedModel,
      reason: pass
        ? "passed (no nonce echo)"
        : probeReason(pass, signal, false, false),
      text: weak.text,
      raw: weak.raw,
    };
  }

  return {
    ...base,
    pass: false,
    muxFailure: true,
    latencyMs: elapsed(),
    prompt: lastPrompt,
    reason: probeReason(false, null, true, false),
  };
}

export function collectProbes(ctx: RunCtx): Promise<ProbeEval[]> {
  return Promise.all(PROBES.map((probe) => runProbe(ctx, probe)));
}

/** The probe that generated the most: the reply worth reading metadata from. */
export function richestProbe(probes: readonly ProbeEval[]): ProbeEval | null {
  return probes.reduce<ProbeEval | null>(
    (best, r) =>
      (r.usage?.completion ?? 0) > (best?.usage?.completion ?? 0) ? r : best,
    null,
  );
}
