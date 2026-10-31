/**
 * Tokenizer families by the input-token deltas they bill for the four
 * SCRIPT_VARIANTS runs (digits, cjk, spaces, code), in that order.
 *
 * Open families were computed from each maker's published tokenizer and agree
 * with the counts their own lanes bill (glm-5.3 and gpt-5.5 to the token).
 * Closed families were measured on lanes that pass every other rule: Gemini on
 * three relays, Claude on five relay paths, which bill five different vectors
 * between them and so get one entry each.
 *
 * Families share a vector where the tokenizers agree on these runs: Llama 4,
 * Muse Spark and Grok 4.3 all bill 101/80/101/120, and DeepSeek, Step and Kimi
 * all bill 101/61/101/120, so those entries name every maker and only rule out
 * the others.
 */

import type { MakerId } from "../makers/table";
import {
  SCRIPT_VARIANT_KEYS,
  SCRIPT_VARIANTS,
  type ScriptVariant,
} from "../probes/prompts";

export type ScriptVector = Readonly<Record<ScriptVariant, number>>;

export type TokenizerFamily = {
  id: string;
  makers: readonly MakerId[];
  vector: ScriptVector;
  /**
   * Relays estimate usage with OpenAI's tokenizers when the upstream reports
   * none, so a match here may be the relay counting, not the model.
   */
  estimator?: boolean;
};

const v = (
  digits: number,
  cjk: number,
  spaces: number,
  code: number,
): ScriptVector => ({ digits, cjk, spaces, code });

export const TOKENIZER_FAMILIES: readonly TokenizerFamily[] = [
  {
    id: "o200k",
    makers: ["openai"],
    vector: v(101, 101, 101, 120),
    estimator: true,
  },
  {
    id: "cl100k",
    makers: ["openai"],
    vector: v(101, 172, 101, 120),
    estimator: true,
  },
  { id: "llama4", makers: ["meta", "xai"], vector: v(101, 80, 101, 120) },
  { id: "gemini", makers: ["google"], vector: v(301, 80, 101, 150) },
  { id: "glm", makers: ["zhipu"], vector: v(191, 70, 101, 120) },
  {
    id: "deepseek",
    makers: ["deepseek", "stepfun", "moonshot"],
    vector: v(101, 61, 101, 120),
  },
  {
    id: "qwen",
    makers: ["alibaba", "xiaomi", "tencent"],
    vector: v(301, 72, 101, 120),
  },
  // Qwen 3.8 changed vocabulary: three a7 merchants billed this to the token.
  { id: "qwen3.8", makers: ["alibaba", "agnes"], vector: v(301, 61, 100, 149) },
  { id: "minimax", makers: ["minimax"], vector: v(101, 70, 101, 120) },
  { id: "ernie", makers: ["baidu"], vector: v(301, 70, 101, 150) },
  { id: "claude-direct", makers: ["anthropic"], vector: v(101, 151, 100, 149) },
  { id: "claude-cloud", makers: ["anthropic"], vector: v(34, 158, 106, 127) },
  { id: "claude-relay-a", makers: ["anthropic"], vector: v(144, 135, 78, 156) },
  { id: "claude-relay-b", makers: ["anthropic"], vector: v(107, 168, 75, 155) },
  { id: "claude-relay-c", makers: ["anthropic"], vector: v(103, 147, 51, 126) },
];

/** One token either way: Vertex bills Gemini one less on every run. */
export const SCRIPT_TOLERANCE = 1;

export function matchTokenizerFamilies(
  measured: ScriptVector,
  families: readonly TokenizerFamily[] = TOKENIZER_FAMILIES,
): TokenizerFamily[] {
  return families.filter((f) =>
    SCRIPT_VARIANT_KEYS.every(
      (k) => Math.abs(f.vector[k] - measured[k]) <= SCRIPT_TOLERANCE,
    ),
  );
}

export const knowsMaker = (
  maker: string,
  families: readonly TokenizerFamily[] = TOKENIZER_FAMILIES,
): boolean => families.some((f) => f.makers.some((m) => m === maker));

/**
 * Billed as characters divided by about four on every run: no tokenizer does
 * that on the Chinese run (the leanest known bills 0.47 a character), so the
 * provider is computing usage itself and hiding the backend's real counts.
 * UTIM's "gemini-4-argon" billed 80/32/50/92.
 */
export function isCharacterEstimate(measured: ScriptVector): boolean {
  return SCRIPT_VARIANT_KEYS.every((k) => {
    const ratio = measured[k] / [...SCRIPT_VARIANTS[k]].length;
    return ratio >= 0.2 && ratio <= 0.3;
  });
}

/**
 * The fewest tokens any run could bill: a third of the leanest known family on
 * that run, and a run's full prompt count includes the anchor on top of it.
 * wusrouter's "claude-fable-5.1-free" billed 4 for the 300 digit run where the
 * leanest family bills 34, and its "claude-opus-5.5" billed less for that run
 * than for the anchor alone.
 */
export function scriptFloor(
  k: ScriptVariant,
  families: readonly TokenizerFamily[] = TOKENIZER_FAMILIES,
): number {
  return Math.floor(Math.min(...families.map((f) => f.vector[k])) / 3);
}

/** Every run whose full prompt count is below what any tokenizer bills for its text alone. */
export function impossibleRuns(
  counts: Readonly<Record<ScriptVariant, number | null>>,
): ScriptVariant[] {
  return SCRIPT_VARIANT_KEYS.filter((k) => {
    const n = counts[k];
    return n !== null && n < scriptFloor(k);
  });
}

/** Each run within this share of the scaled family count. */
const SCALE_TOLERANCE = 0.08;
/** A factor this close to 1 is ordinary relay noise, not scaling. */
const SCALE_NEUTRAL = 0.1;

/**
 * A known family's vector multiplied by one constant on every run: usage
 * scaled up to overbill or down to hide the vocabulary. a7:6314 "claude-sonnet-5-5"
 * billed Claude's vector times 7.55, kdy1's codex-pro "gpt-6-astra" o200k times
 * 1.33, ts1's claude-max a Claude relay vector times exactly 2.
 */
export function matchScaledFamily(
  measured: ScriptVector,
  families: readonly TokenizerFamily[] = TOKENIZER_FAMILIES,
): { family: TokenizerFamily; factor: number } | null {
  let best: { family: TokenizerFamily; factor: number } | null = null;
  for (const family of families) {
    const ratios = SCRIPT_VARIANT_KEYS.map(
      (k) => measured[k] / family.vector[k],
    );
    const factor = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (Math.abs(factor - 1) <= SCALE_NEUTRAL) continue;
    if (!ratios.every((r) => Math.abs(r - factor) / factor <= SCALE_TOLERANCE))
      continue;
    if (!best || Math.abs(factor - 1) < Math.abs(best.factor - 1))
      best = { family, factor };
  }
  return best;
}
