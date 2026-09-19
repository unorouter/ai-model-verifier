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
 * or invent usage outright. A signature table therefore ships EMPTY: only a
 * caller who has calibrated a table on a specific endpoint family should pass
 * one, and even then only between-model differences on the same endpoint are
 * evidence.
 */

import { defineRule, type RuleCtx } from "./types";

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

export function tierForDelta(
  delta: number,
  signatures: TierSignatures = DEFAULT_TIER_SIGNATURES,
): string | null {
  for (const [tier, values] of Object.entries(signatures))
    if (values.includes(delta)) return tier;
  return null;
}

/**
 * The served tier when the fingerprint names one other than requested, or
 * null. `tiers` is the wire's tier vocabulary (opus, sonnet, haiku, fable).
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

async function fingerprintResult(
  ctx: RuleCtx<"fixedText">,
): Promise<TokenizerFingerprintResult> {
  const ft = await ctx.evidence("fixedText");
  const empty = {
    delta: null,
    shortInputTokens: null,
    longInputTokens: null,
    servedModel: null,
    matchedTier: null,
  };
  for (const r of [ft.short, ft.long])
    if (r.status === null || r.status >= 400)
      return {
        state: "unmeasured",
        ...empty,
        reason: `probe-failed:${r.status ?? "network"}`,
      };
  const shortMeta = ctx.wire.read.meta(ft.short.data);
  const short = shortMeta.usage?.prompt ?? null;
  const long = ctx.wire.read.meta(ft.long.data).usage?.prompt ?? null;
  if (short === null || long === null)
    return {
      state: "unmeasured",
      ...empty,
      servedModel: shortMeta.detectedModel,
      reason: "no-usage-reported",
    };
  const delta = long - short;
  return {
    state: "measured",
    delta,
    shortInputTokens: short,
    longInputTokens: long,
    servedModel: shortMeta.detectedModel,
    matchedTier: tierForDelta(
      delta,
      ctx.checks.tokenizerFingerprint?.signatures,
    ),
  };
}

export const tokenizerFingerprintRule = defineRule({
  id: "tokenizer-fingerprint",
  layer: "evidence",
  needs: ["fixedText"],
  check: "tokenizerFingerprint",
  // Claude only, over either wire that carries its usage as is.
  applies: (ctx) => ctx.maker.id === "anthropic" && ctx.wire.id !== "gemini",
  judge: async (ctx) => {
    if (!ctx.maker.tiers) return null;
    const r = await fingerprintResult(ctx);
    const tier = judgeTokenizerFingerprint(ctx.model, r, ctx.maker.tiers);
    return tier
      ? {
          severity: "fail",
          reason: `tokenizer-fingerprint: delta ${r.delta} is the ${tier} signature, requested ${ctx.model}`,
          data: r,
        }
      : null;
  },
  report: async (ctx) => ({
    tokenizerFingerprint: await fingerprintResult(ctx),
  }),
});
