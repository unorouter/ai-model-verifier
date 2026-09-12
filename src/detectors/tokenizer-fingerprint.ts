/**
 * Tokenizer fingerprint: how many input tokens the endpoint bills for a fixed
 * run of text.
 *
 * Every other tier signal can be coached: a system prompt teaches the model to
 * say "Opus", a relay rewrites the `model` field. The token count for a fixed
 * text cannot be coached, because the model never sees the question. It is
 * decided by the tokenizer behind the endpoint, and Claude generations do not
 * share one: on 2026-09-12, across 68 marketplace lanes measured twice each,
 * every lane whose reply named claude-haiku-4-5 billed a delta of exactly 90
 * (18 of 18), while lanes serving opus-4-6 and fable clustered at 84 on the
 * same relay path. Two of the lanes at 90 echoed an opus name in the `model`
 * field and were haiku by every other measure.
 *
 * Two uses, in order of confidence:
 *
 *  1. Drift. The delta is deterministic per lane (identical on repeat), so a
 *     change between two measurements of the same lane means the backend
 *     changed, whatever the reply now calls itself. The caller keeps the prior.
 *  2. Signature. A delta known to belong to a cheaper tier than the one
 *     requested. The table is calibration, not law: relays that count tokens
 *     themselves produce their own values (211, 609 were both seen), so an
 *     unknown delta proves nothing and only a listed one is judged.
 */

import type { TransportFn } from "../transport";
import {
  COUNT_PROBE_MAX_TOKENS,
  LONG_PROMPT,
  SHORT_PROMPT,
} from "../internal/fixed-text";

/** Wire format the endpoint speaks; Claude is sold over both. */
export type CountWire = "anthropic" | "openai";

export type TierSignatures = Readonly<Record<string, readonly number[]>>;

/**
 * Deltas measured on lanes whose reply named the tier, 2026-09-12. Only haiku
 * is listed: its 18 samples agreed to the token, while opus and fable spread
 * across relay counting paths and would condemn honest lanes.
 */
export const DEFAULT_TIER_SIGNATURES: TierSignatures = { haiku: [90] };

export type TokenizerFingerprintState = "measured" | "unmeasured";

export type TokenizerFingerprintResult = {
  state: TokenizerFingerprintState;
  /** long minus short input tokens; the fingerprint itself. */
  delta: number | null;
  shortInputTokens: number | null;
  longInputTokens: number | null;
  /** `model` echoed on the short reply, when the endpoint reported one. */
  servedModel: string | null;
  /** Tier whose signature the delta matched, when any did. */
  matchedTier: string | null;
  reason?: string;
};

const intOf = (v: unknown): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;

function readInputTokens(data: unknown, wire: CountWire): number | null {
  const u = (data as { usage?: Record<string, unknown> } | null)?.usage;
  if (!u || typeof u !== "object") return null;
  return wire === "anthropic"
    ? intOf(u["input_tokens"])
    : intOf(u["prompt_tokens"]);
}

function readServedModel(data: unknown): string | null {
  const m = (data as { model?: unknown } | null)?.model;
  return typeof m === "string" && m.length > 0 ? m : null;
}

export function tierForDelta(
  delta: number,
  signatures: TierSignatures = DEFAULT_TIER_SIGNATURES,
): string | null {
  for (const [tier, values] of Object.entries(signatures))
    if (values.includes(delta)) return tier;
  return null;
}

/**
 * The served tier when the fingerprint names one cheaper than requested, or
 * null. `tiers` is the provider's tier vocabulary (opus, sonnet, haiku, fable).
 */
export function judgeTokenizerFingerprint(
  requestedModel: string,
  result: TokenizerFingerprintResult,
  tiers: readonly string[],
): string | null {
  if (result.state !== "measured" || result.matchedTier === null) return null;
  const req = requestedModel.toLowerCase();
  const reqTier = tiers.filter((t) => req.includes(t));
  if (reqTier.length !== 1) return null;
  return reqTier[0] === result.matchedTier ? null : result.matchedTier;
}

/** True when two measurements of the same lane disagree: the backend changed. */
export function fingerprintDrifted(
  prior: number | null | undefined,
  current: TokenizerFingerprintResult,
): boolean {
  return (
    typeof prior === "number" &&
    current.state === "measured" &&
    current.delta !== null &&
    current.delta !== prior
  );
}

export async function measureTokenizerFingerprint(opts: {
  transport: TransportFn;
  baseUrl: string;
  apiKey: string;
  model: string;
  wire: CountWire;
  timeoutMs: number;
  signatures?: TierSignatures;
}): Promise<TokenizerFingerprintResult> {
  const base = opts.baseUrl.replace(/\/+$/, "");
  const url =
    opts.wire === "anthropic"
      ? `${base}/v1/messages`
      : `${base}/v1/chat/completions`;
  const headers: Record<string, string> =
    opts.wire === "anthropic"
      ? {
          "Content-Type": "application/json",
          "x-api-key": opts.apiKey,
          "anthropic-version": "2023-06-01",
        }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opts.apiKey}`,
        };
  const ask = (prompt: string) =>
    opts.transport({
      mode: "direct",
      url,
      headers,
      reqBody: {
        model: opts.model,
        max_tokens: COUNT_PROBE_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      },
      timeoutMs: opts.timeoutMs,
    });

  const [shortRes, longRes] = await Promise.all([
    ask(SHORT_PROMPT),
    ask(LONG_PROMPT),
  ]);
  const empty = {
    delta: null,
    shortInputTokens: null,
    longInputTokens: null,
    servedModel: null,
    matchedTier: null,
  };
  for (const r of [shortRes, longRes])
    if (r.status === null || r.status >= 400)
      return {
        state: "unmeasured",
        ...empty,
        reason: `probe-failed:${r.status ?? "network"}`,
      };

  const short = readInputTokens(shortRes.data, opts.wire);
  const long = readInputTokens(longRes.data, opts.wire);
  const servedModel = readServedModel(shortRes.data);
  if (short === null || long === null)
    return {
      state: "unmeasured",
      ...empty,
      servedModel,
      reason: "no-usage-reported",
    };
  const delta = long - short;
  return {
    state: "measured",
    delta,
    shortInputTokens: short,
    longInputTokens: long,
    servedModel,
    matchedTier: tierForDelta(delta, opts.signatures),
  };
}
