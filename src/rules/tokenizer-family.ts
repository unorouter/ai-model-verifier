/**
 * Tokenizer family: which vocabulary billed the four script runs.
 *
 * A system prompt can make any model call itself Claude, but it cannot change
 * how the backend splits text. Radox sold "claude-fable-5.1" that passed the
 * identity probes on most keys under a hidden persona prompt, yet billed
 * 101/80/101/120, the Llama 4 vocabulary Meta's Muse Spark uses, where every
 * Claude path measured bills 135 or more on the Chinese run.
 *
 * Fails only when all of these hold, so a quirky relay cannot trip it:
 * the claimed maker has known vectors, the measured vector matches none of
 * them, it does match another family, and that family is not one relays
 * estimate usage with (OpenAI's).
 */

import type { ScriptVariant } from "../probes/prompts";
import {
  knowsMaker,
  matchTokenizerFamilies,
  type ScriptVector,
} from "../models/tokenizers";
import { defineRule, type RuleCtx } from "./types";

export type TokenizerFamilyState =
  | "own"
  /** Matches another maker's family and none of the claimed maker's. */
  | "foreign"
  /** Matches only an estimator family: the relay may be counting. */
  | "estimated"
  /** Measured but matches no known family. */
  | "unknown"
  | "unmeasured";

export type TokenizerFamilyResult = {
  state: TokenizerFamilyState;
  vector: ScriptVector | null;
  families: string[];
  makers: string[];
  reason?: string;
};

/** Judge one measured vector against the claimed maker. Pure. */
export function judgeTokenizerFamily(
  maker: string,
  vector: ScriptVector,
): TokenizerFamilyResult {
  const matched = matchTokenizerFamilies(vector);
  const base = {
    vector,
    families: matched.map((f) => f.id),
    makers: [...new Set(matched.flatMap((f) => f.makers))],
  };
  if (matched.length === 0) return { state: "unknown", ...base };
  if (matched.some((f) => f.makers.some((m) => m === maker)))
    return { state: "own", ...base };
  if (matched.every((f) => f.estimator)) return { state: "estimated", ...base };
  if (!knowsMaker(maker))
    return {
      state: "unknown",
      ...base,
      reason: `no vectors known for ${maker}`,
    };
  return { state: "foreign", ...base };
}

async function familyResult(
  ctx: RuleCtx<"scriptTokens">,
): Promise<TokenizerFamilyResult> {
  const ev = await ctx.evidence("scriptTokens");
  const empty = { vector: null, families: [], makers: [] };
  const prompt = (r: (typeof ev)["base"]) =>
    r.status !== null && r.status < 400
      ? (ctx.wire.read.meta(r.data).usage?.prompt ?? null)
      : null;
  const base = prompt(ev.base);
  if (base === null)
    return {
      state: "unmeasured",
      ...empty,
      reason: `anchor ${ev.base.status ?? "network"}: ${ev.base.error ?? "no usage"}`,
    };
  // A cache split between anchor and run shows as a negative or absurd delta.
  const delta = (k: ScriptVariant) => {
    const n = prompt(ev.variants[k]);
    return n === null || n - base <= 0 || n - base > 2000 ? null : n - base;
  };
  const digits = delta("digits");
  const cjk = delta("cjk");
  const spaces = delta("spaces");
  const code = delta("code");
  if (digits === null || cjk === null || spaces === null || code === null)
    return {
      state: "unmeasured",
      ...empty,
      reason: "a run had no usable count",
    };
  return judgeTokenizerFamily(ctx.maker.id, { digits, cjk, spaces, code });
}

export const tokenizerFamilyRule = defineRule({
  id: "tokenizer-family",
  layer: "evidence",
  needs: ["scriptTokens"],
  check: "tokenizerFamily",
  // Gemini's native wire reports usage its own way; the OpenAI and Anthropic wires carry it as billed.
  applies: (ctx) => ctx.wire.id !== "gemini",
  judge: async (ctx) => {
    const r = await familyResult(ctx);
    if (r.state !== "foreign" || !r.vector) return null;
    const v = r.vector;
    return {
      severity: "fail",
      reason: `tokenizer-family: billed ${v.digits}/${v.cjk}/${v.spaces}/${v.code}, the ${r.families.join("/")} vocabulary (${r.makers.join(", ")}), not ${ctx.maker.id}`,
      data: r,
    };
  },
  report: async (ctx) => ({ tokenizerFamily: await familyResult(ctx) }),
});
