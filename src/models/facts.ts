/**
 * Everything the engine knows about a model id, in one table. Adapters and rules
 * read facts; none of them carries a model-name regex of its own.
 *
 * Resolution is layered, first match per field: consumer entries, then this
 * table, in order. A field an entry leaves out falls through to later entries,
 * so a narrow entry (opus-4-7 thinks adaptively) sits above the broad one
 * (every claude belongs to anthropic) and both apply.
 */

import { MAKERS, type MakerId } from "../makers/table";
import { makerForModel } from "../makers/resolve";
import type { Maker } from "../makers/types";

export type ThinkingMode = "adaptive" | "extended" | "none";
export type TokenizerGeneration = "claude-v1" | "claude-v2";

export type ModelFacts<M extends string = MakerId> = {
  /** Who trained it; null when the id names no maker the tables know. */
  maker: M | null;
  thinking: ThinkingMode;
  tokenizer: TokenizerGeneration | null;
  /** Cannot switch reasoning off (a reply with no thought tokens is a cheaper tier). */
  alwaysThinks: boolean;
  /** Reasoning models need room for hidden thought before the visible answer. */
  minOutputTokens: number | null;
};

export type FactsEntry<M extends string = MakerId> = {
  /** Glob(s) over the normalised id: `*` is the only wildcard, no `*` means exact. */
  match: string | readonly string[];
} & Partial<ModelFacts<M>>;

/** Lowercase, `.` and `_` to `-`, any `vendor/` or `pool/` prefix stripped. */
export const normalizeModelId = (model: string): string =>
  model.trim().toLowerCase().replace(/[._]/g, "-").split("/").pop() ?? "";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function globMatches(name: string, pattern: string): boolean {
  const p = pattern.toLowerCase();
  if (!p.includes("*")) return name === p;
  return new RegExp(`^${p.split("*").map(escapeRegExp).join(".*")}$`).test(
    name,
  );
}

export const MODEL_FACTS = [
  {
    match: ["claude-opus-4-7*", "claude-opus-4-8*"],
    thinking: "adaptive",
    tokenizer: "claude-v2",
  },
  {
    match: [
      "claude-opus-4-6*",
      "claude-opus-4-5*",
      "claude-opus-4-1*",
      "claude-sonnet-4-6*",
      "claude-sonnet-4-5*",
      "claude-haiku-4-5*",
    ],
    thinking: "extended",
  },
  { match: "*claude*", tokenizer: "claude-v1" },
  { match: "gemini-2-5-pro*", alwaysThinks: true },
  // Gemini thinks before it answers over the OpenAI wire too, and a 60 token
  // cap left a few characters of visible reply on the order book sellers.
  { match: ["gemini-2-5*", "gemini-3*"], minOutputTokens: 2000 },
  // Open-weight thinkers answer after a hidden reasoning pass on every relay
  // that leaves it on; a 60 token cap returned a bracket and nothing else.
  {
    match: [
      "glm-5*",
      "kimi-k2-6*",
      "kimi-k2-7*",
      "kimi-k3*",
      "deepseek-v4*",
      "minimax-m2-5*",
      "minimax-m2-7*",
      "minimax-m3*",
      "mimo-v2-5*",
      "qwen3-8*",
      "hy4*",
    ],
    minOutputTokens: 2000,
  },
  {
    match: [
      "gpt-5*",
      "o1*",
      "o2*",
      "o3*",
      "o4*",
      "o5*",
      "o6*",
      "o7*",
      "o8*",
      "o9*",
    ],
    minOutputTokens: 2000,
  },
] as const satisfies readonly FactsEntry[];

export const defineModelFacts = <const F extends readonly FactsEntry[]>(
  facts: F,
): F => facts;

const DEFAULTS: ModelFacts<string> = {
  maker: null,
  thinking: "none",
  tokenizer: null,
  alwaysThinks: false,
  minOutputTokens: null,
};

const FACT_KEYS = [
  "maker",
  "thinking",
  "tokenizer",
  "alwaysThinks",
  "minOutputTokens",
] as const satisfies readonly (keyof ModelFacts)[];

function take<K extends keyof ModelFacts<string>>(
  out: ModelFacts<string>,
  entry: Partial<ModelFacts<string>>,
  key: K,
  seen: Set<keyof ModelFacts<string>>,
): void {
  const v = entry[key];
  if (seen.has(key) || v === undefined) return;
  out[key] = v;
  seen.add(key);
}

/** Layered first match per field: consumer entries, the table, then the maker globs. */
export function resolveModelFacts(
  model: string,
  extra?: readonly FactsEntry[],
): ModelFacts;
export function resolveModelFacts<M extends string>(
  model: string,
  extra: readonly FactsEntry<M>[],
  makers: readonly Maker<M>[],
): ModelFacts<M>;
export function resolveModelFacts(
  model: string,
  extra: readonly FactsEntry<string>[] = [],
  makers: readonly Maker<string>[] = MAKERS,
): ModelFacts<string> {
  const id = normalizeModelId(model);
  const out: ModelFacts<string> = { ...DEFAULTS };
  const seen = new Set<keyof ModelFacts<string>>();
  for (const entry of [...extra, ...MODEL_FACTS]) {
    const patterns =
      typeof entry.match === "string" ? [entry.match] : entry.match;
    if (!patterns.some((p) => globMatches(id, p))) continue;
    for (const key of FACT_KEYS) take(out, entry, key, seen);
  }
  if (!seen.has("maker")) out.maker = makerForModel(id, makers);
  return out;
}
