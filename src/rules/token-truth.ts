/**
 * Token accounting.
 *
 * The signature answers "is this really Claude". This answers a different
 * question the signature cannot: "are the numbers you are billing me true". A
 * relay can forward genuine Claude and still inflate `input_tokens` on every
 * call, and nothing in an identity probe would notice.
 *
 * Ported from veridrop (AGPL-3.0) `token_usage.py` / `integrity.py`, whose
 * tolerances were calibrated against the official API. Do not tighten them
 * without re-measuring: the loose-looking bounds exist because real Anthropic
 * responses sat near them.
 */

import { COUNT_PROBE_MAX_TOKENS as MAX_TOKENS } from "../probes/prompts";
import type { ModelFacts } from "../models/facts";
import { defineRule, type RuleCtx } from "./types";

/**
 * Expected `input_tokens` growth between the short and long prompt. Two bands
 * because Anthropic changed tokenizer: a relay claiming a new-tokenizer model
 * while serving an older one lands in the wrong band, which makes this a tier
 * check as well as a billing check.
 */
const DELTA_OLD = { min: 45, max: 140 };
const DELTA_NEW = { min: 90, max: 230 };

/** `count_tokens` should agree with the billed `input_tokens` this closely. */
const countTolerance = (n: number) => Math.max(4, Math.round(n * 0.2));

export type TokenTruthCheck = {
  id: "usage-present" | "input-delta" | "output-bounded" | "count-tokens";
  pass: boolean;
  detail: string;
};

export type TokenTruthResult = {
  /** null when nothing could be measured (endpoint refused every probe). */
  ok: boolean | null;
  checks: TokenTruthCheck[];
  shortInputTokens: number | null;
  longInputTokens: number | null;
  countTokens: number | null;
  reason?: string;
};

export const expectedInputDelta = (facts: ModelFacts) =>
  facts.tokenizer === "claude-v2" ? DELTA_NEW : DELTA_OLD;

async function tokenTruthResult(
  ctx: RuleCtx<"fixedText" | "countTokens">,
): Promise<TokenTruthResult> {
  const noCounts = {
    shortInputTokens: null,
    longInputTokens: null,
    countTokens: null,
  };
  const ft = await ctx.evidence("fixedText");
  if (ft.short.status === null || ft.short.status >= 400)
    return {
      ok: null,
      checks: [],
      ...noCounts,
      reason: `probe-failed:${ft.short.status ?? "network"}`,
    };

  const s = ctx.wire.read.meta(ft.short.data).usage;
  const l = ctx.wire.read.meta(ft.long.data).usage;
  const checks: TokenTruthCheck[] = [];

  const shortIn = s?.prompt ?? null;
  const longIn = l?.prompt ?? null;
  const usagePresent = shortIn !== null && longIn !== null;
  checks.push({
    id: "usage-present",
    pass: usagePresent,
    detail: usagePresent
      ? `short=${shortIn}, long=${longIn}`
      : "endpoint reported no usage counts",
  });
  // Without usage there is nothing to verify; a missing field is not fraud.
  if (shortIn === null || longIn === null)
    return { ok: null, checks, ...noCounts, reason: "no-usage-reported" };

  const band = expectedInputDelta(ctx.facts);
  const delta = longIn - shortIn;
  checks.push({
    id: "input-delta",
    pass: delta >= band.min && delta <= band.max,
    detail: `delta=${delta}, expected ${band.min}-${band.max}`,
  });

  // Output above the cap we set means the count is invented, not merely padded.
  const outputs = [s?.completion ?? null, l?.completion ?? null].filter(
    (v): v is number => v !== null,
  );
  checks.push({
    id: "output-bounded",
    pass: outputs.every((v) => v > 0 && v <= MAX_TOKENS + 4),
    detail: `outputs=${outputs.join(",") || "none"} (cap ${MAX_TOKENS})`,
  });

  // The same upstream pricing the same request without generating: the
  // strongest anti-inflation signal available, when the endpoint exposes it.
  // A missing count endpoint is common on relays and proves nothing, so it is
  // simply absent from the checks rather than counted as a failure.
  let counted: number | null = null;
  const countRes = await ctx.evidence("countTokens");
  if (countRes && countRes.status !== null && countRes.status < 400) {
    counted = ctx.wire.read.countedTokens?.(countRes.data) ?? null;
    if (counted !== null) {
      const drift = Math.abs(counted - shortIn);
      const tol = countTolerance(shortIn);
      checks.push({
        id: "count-tokens",
        pass: drift <= tol,
        detail: `count=${counted} vs billed=${shortIn}, drift=${drift} (tolerance ${tol})`,
      });
    }
  }

  return {
    ok: checks.every((c) => c.pass),
    checks,
    shortInputTokens: shortIn,
    longInputTokens: longIn,
    countTokens: counted,
  };
}

export const tokenTruthRule = defineRule({
  id: "token-truth",
  layer: "note",
  needs: ["fixedText", "countTokens"],
  check: "tokenTruth",
  applies: (ctx) => ctx.wire.read.countedTokens !== undefined,
  judge: async (ctx) => {
    const r = await tokenTruthResult(ctx);
    if (r.ok !== false) return null;
    const failed = r.checks.filter((c) => !c.pass).map((c) => c.id);
    return { severity: "note", reason: `token-truth: ${failed.join(", ")}` };
  },
  report: async (ctx) => ({ tokenTruth: await tokenTruthResult(ctx) }),
});
