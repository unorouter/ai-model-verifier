import { type MakerId } from "./makers/table";
import type { Maker } from "./makers/types";
import type { FactsEntry } from "./models/facts";
import { type RuleId } from "./rules/table";
import type { Rule } from "./rules/types";
import type { RuleRun, VerifyOptions, VerifyResult } from "./types";
import { type VendorId } from "./vendors/table";
import type { VendorAdapter } from "./vendors/types";
import { type Registry } from "./verify";
/**
 * A verifier with the built-in tables plus the caller's own vendors, makers,
 * rules and model facts. Consumer rules run after the built-ins (so they never
 * outrank them); `omit` drops built-ins a consumer replaces or disagrees with;
 * consumer model facts and makers are consulted before the tables.
 */
export declare function createVerifier<V extends string = never, R extends string = never, M extends string = never>(cfg: {
    vendors?: readonly VendorAdapter<V>[];
    makers?: readonly Maker<M>[];
    rules?: readonly Rule<R>[];
    omit?: readonly RuleId[];
    modelFacts?: readonly FactsEntry<MakerId | M>[];
}): {
    registry: Registry<"anthropic" | "gemini" | "openai" | V, "cjk-leak" | "coding-tool" | "envelope" | "foreign" | "mux" | "quorum" | "scam" | "served-model-mismatch" | "signature" | "substituted" | "survey" | "thinking-floor" | "throughput" | "tier-self-report" | "token-truth" | "tokenizer-fingerprint" | R, "alibaba" | "anthropic" | "deepseek" | "google" | "meta" | "minimax" | "mistral" | "moonshot" | "openai" | "tencent" | "writer" | "xai" | "xiaomi" | "zhipu" | M>;
    verify: (opts: VerifyOptions<VendorId | V>) => Promise<VerifyResult<VendorId | V, RuleId | R, MakerId | M>>;
    runRules: (opts: VerifyOptions<VendorId | V> & {
        only: readonly (RuleId | R)[];
    }) => Promise<RuleRun<RuleId | R>>;
};
//# sourceMappingURL=registry.d.ts.map