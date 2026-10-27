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
 *
 * Also fails when every run bills about one token per four characters: that
 * is a provider making up usage so the vocabulary behind it cannot be seen.
 * Same for any run billed below what any tokenizer needs for its text alone.
 * The a7 Claude merchants that did so (3825, 5630, 1169) also refused the
 * Tiananmen question the way Chinese models do, so it was never a cache.
 *
 * The Chinese run is sent twice more behind two different nonces: a real
 * tokenizer bills the same text the same way every time, wusrouter billed it
 * 89, 92, 8 and 40, and every passing Claude lane we logged bills one vector.
 *
 * Runs that never answered are inconclusive rather than silent: the probes
 * alone call any good persona prompt genuine.
 */

import type { ScriptVariant } from "../probes/prompts";
import { isTransientError } from "../identity/signals";
import {
  impossibleRuns,
  isCharacterEstimate,
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
  /** Billed as characters / 4: the provider makes up usage, hiding the backend. */
  | "char-estimated"
  /** Runs billed below what any tokenizer needs for their text: made up usage. */
  | "impossible"
  /** Measured but matches no known family. */
  | "unknown"
  | "unmeasured"
  /** The same text behind two nonces billed far apart: the counts are made up. */
  | "unstable"
  /** A run timed out or the endpoint was busy, so nothing could be read. */
  | "unanswered";

export type TokenizerFamilyResult = {
  state: TokenizerFamilyState;
  vector: ScriptVector | null;
  families: string[];
  makers: string[];
  reason?: string;
  /** Runs billed below every tokenizer, with their full prompt counts. */
  impossible?: { run: ScriptVariant; prompt: number }[];
  /** Prompt counts of the two nonce copies of the Chinese run. */
  repeats?: [number, number];
};

/**
 * More than double and ten tokens apart is no tokenizer. A router may serve the
 * two copies through a provider that counts and one that estimates (Claude 151
 * against o200k's 101 on this text), so a closer pair proves nothing.
 */
const REPEAT_UNSTABLE = (a: number, b: number) =>
  Math.abs(a - b) > 10 && Math.max(a, b) > 2 * Math.min(a, b);

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
  if (matched.length === 0)
    return {
      state: isCharacterEstimate(vector) ? "char-estimated" : "unknown",
      ...base,
    };
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
  const counts = {
    digits: prompt(ev.variants.digits),
    cjk: prompt(ev.variants.cjk),
    spaces: prompt(ev.variants.spaces),
    code: prompt(ev.variants.code),
  };
  const r1 = prompt(ev.repeats[0]);
  const r2 = prompt(ev.repeats[1]);
  if (r1 !== null && r2 !== null && REPEAT_UNSTABLE(r1, r2))
    return { state: "unstable", ...empty, repeats: [r1, r2] };
  const impossible = impossibleRuns(counts).flatMap((run) => {
    const prompt = counts[run];
    return prompt === null ? [] : [{ run, prompt }];
  });
  if (impossible.length > 0)
    return { state: "impossible", ...empty, impossible };
  const all = [ev.base, ...Object.values(ev.variants), ...ev.repeats];
  const busy = all.find((r) =>
    r.status === null
      ? isTransientError(r.error ?? "")
      : isTransientError(`HTTP ${r.status}`),
  );
  if (busy)
    return {
      state: "unanswered",
      ...empty,
      reason: `${busy.status ?? "network"}: ${busy.error ?? "busy"}`,
    };
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
    if (r.state === "unstable" && r.repeats)
      return {
        severity: "fail",
        reason: `tokenizer-family: billed the same Chinese text ${r.repeats[0]} and then ${r.repeats[1]} prompt tokens; a real tokenizer bills identical text identically, so the provider makes up usage and hides the model's real counts`,
        data: r,
      };
    if (r.state === "impossible" && r.impossible) {
      const runs = r.impossible
        .map((i) => `${i.prompt} for the ${i.run} run`)
        .join(", ");
      return {
        severity: "fail",
        reason: `tokenizer-family: billed ${runs}, below what any known tokenizer needs for that text alone: the provider makes up usage and hides the model's real counts`,
        data: r,
      };
    }
    if (r.state === "unanswered" && knowsMaker(ctx.maker.id))
      return {
        severity: "inconclusive",
        reason: `tokenizer-family: the token count runs did not answer (${r.reason}), so the backend's vocabulary was never measured`,
        data: r,
      };
    if (!r.vector) return null;
    const v = r.vector;
    if (r.state === "char-estimated")
      return {
        severity: "fail",
        reason: `tokenizer-family: billed ${v.digits}/${v.cjk}/${v.spaces}/${v.code}, about one token per four characters on every run including Chinese, which no tokenizer does: the provider computes usage itself and hides the model's real counts`,
        data: r,
      };
    if (r.state !== "foreign") return null;
    return {
      severity: "fail",
      reason: `tokenizer-family: billed ${v.digits}/${v.cjk}/${v.spaces}/${v.code}, the ${r.families.join("/")} vocabulary (${r.makers.join(", ")}), not ${ctx.maker.id}`,
      data: r,
    };
  },
  report: async (ctx) => ({ tokenizerFamily: await familyResult(ctx) }),
});
