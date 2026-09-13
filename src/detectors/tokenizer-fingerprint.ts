/**
 * Tokenizer fingerprint: how many input tokens the endpoint bills for a fixed
 * run of text, measured as the difference between a long and a short prompt so
 * anything a relay injects cancels out.
 *
 * What it is good for: drift. The delta is deterministic per endpoint (68
 * marketplace lanes measured twice each agreed to the token on every repeat),
 * so a change between two measurements of the same lane means the backend
 * changed, whatever the reply now calls itself. Keep the prior per lane and
 * compare with `fingerprintDrifted`.
 *
 * What it is NOT good for: naming the tier from the number alone. Opus 4.6,
 * Sonnet 4.6 and Haiku 4.5 share one tokenizer, so they bill the same delta on
 * the same path, and relays count differently from each other (77, 90, 134,
 * 160, 211 and 609 were all seen for one text on lanes echoing one model name)
 * or invent usage outright (13 tokens for eighty words, negative deltas on
 * repeat). A signature table therefore ships EMPTY: only a caller who has
 * calibrated a table on a specific endpoint family, per model generation and
 * across several text lengths, should pass one, and even then only
 * between-model differences on the same endpoint are evidence.
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

/** Empty on purpose; see the module note. Pass your own calibration. */
export const DEFAULT_TIER_SIGNATURES: TierSignatures = {};

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
