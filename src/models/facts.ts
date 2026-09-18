/**
 * Everything the engine knows about a model id, in one table. Adapters and rules
 * read facts; none of them carries a model-name regex of its own.
 *
 * Resolution is layered, first match per field: consumer entries, then this
 * table, in order. A field an entry leaves out falls through to later entries,
 * so a narrow entry (opus-4-7 thinks adaptively) sits above the broad one
 * (every claude belongs to anthropic) and both apply.
 */

import type { VendorId } from "../vendors/table";

export type ThinkingMode = "adaptive" | "extended" | "none";
export type TokenizerGeneration = "claude-v1" | "claude-v2";

export type ModelFacts = {
  /** Vendor that trained it; null when the id names nothing the table knows. */
  vendor: VendorId | null;
  thinking: ThinkingMode;
  tokenizer: TokenizerGeneration | null;
  /** Cannot switch reasoning off (a reply with no thought tokens is a cheaper tier). */
  alwaysThinks: boolean;
  /** Reasoning models need room for hidden thought before the visible answer. */
  minOutputTokens: number | null;
};

export type FactsEntry = {
  /** Glob(s) over the normalised id: `*` is the only wildcard, no `*` means exact. */
  match: string | readonly string[];
} & Partial<ModelFacts>;

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
  { match: "*claude*", vendor: "anthropic", tokenizer: "claude-v1" },
  { match: "gemini-2-5-pro*", alwaysThinks: true },
  { match: "*gemini*", vendor: "gemini" },
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
  { match: ["gpt-*", "o1*", "o3*", "o4*", "chatgpt*"], vendor: "openai" },
] as const satisfies readonly FactsEntry[];

export const defineModelFacts = <const F extends readonly FactsEntry[]>(
  facts: F,
): F => facts;

const DEFAULTS: ModelFacts = {
  vendor: null,
  thinking: "none",
  tokenizer: null,
  alwaysThinks: false,
  minOutputTokens: null,
};

const FACT_KEYS = [
  "vendor",
  "thinking",
  "tokenizer",
  "alwaysThinks",
  "minOutputTokens",
] as const satisfies readonly (keyof ModelFacts)[];

function take<K extends keyof ModelFacts>(
  out: ModelFacts,
  entry: Partial<ModelFacts>,
  key: K,
  seen: Set<keyof ModelFacts>,
): void {
  const v = entry[key];
  if (seen.has(key) || v === undefined) return;
  out[key] = v;
  seen.add(key);
}

export function resolveModelFacts(
  model: string,
  extra: readonly FactsEntry[] = [],
): ModelFacts {
  const id = normalizeModelId(model);
  const out: ModelFacts = { ...DEFAULTS };
  const seen = new Set<keyof ModelFacts>();
  for (const entry of [...extra, ...MODEL_FACTS]) {
    const patterns =
      typeof entry.match === "string" ? [entry.match] : entry.match;
    if (!patterns.some((p) => globMatches(id, p))) continue;
    for (const key of FACT_KEYS) take(out, entry, key, seen);
  }
  return out;
}
