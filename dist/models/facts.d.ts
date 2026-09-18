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
export declare const normalizeModelId: (model: string) => string;
export declare function globMatches(name: string, pattern: string): boolean;
export declare const MODEL_FACTS: readonly [{
    readonly match: readonly ["claude-opus-4-7*", "claude-opus-4-8*"];
    readonly thinking: "adaptive";
    readonly tokenizer: "claude-v2";
}, {
    readonly match: readonly ["claude-opus-4-6*", "claude-opus-4-5*", "claude-opus-4-1*", "claude-sonnet-4-6*", "claude-sonnet-4-5*", "claude-haiku-4-5*"];
    readonly thinking: "extended";
}, {
    readonly match: "*claude*";
    readonly vendor: "anthropic";
    readonly tokenizer: "claude-v1";
}, {
    readonly match: "gemini-2-5-pro*";
    readonly alwaysThinks: true;
}, {
    readonly match: "*gemini*";
    readonly vendor: "gemini";
}, {
    readonly match: readonly ["gpt-5*", "o1*", "o2*", "o3*", "o4*", "o5*", "o6*", "o7*", "o8*", "o9*"];
    readonly minOutputTokens: 2000;
}, {
    readonly match: readonly ["gpt-*", "o1*", "o3*", "o4*", "chatgpt*"];
    readonly vendor: "openai";
}];
export declare const defineModelFacts: <const F extends readonly FactsEntry[]>(facts: F) => F;
export declare function resolveModelFacts(model: string, extra?: readonly FactsEntry[]): ModelFacts;
//# sourceMappingURL=facts.d.ts.map