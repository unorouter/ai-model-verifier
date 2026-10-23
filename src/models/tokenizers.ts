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
  { id: "qwen3.8", makers: ["alibaba"], vector: v(301, 61, 100, 149) },
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
