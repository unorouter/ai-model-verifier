import { callWire } from "./engine/context";
import { type FactsEntry } from "./models/facts";
import { type MakerId } from "./makers/table";
import type { Maker } from "./makers/types";
import { type RuleId } from "./rules/table";
import type { Rule } from "./rules/types";
import type { RuleRun, VerifyOptions, VerifyResult } from "./types";
import { type VendorId } from "./vendors/table";
import type { VendorAdapter } from "./vendors/types";
export type Registry<V extends string = VendorId, R extends string = RuleId, M extends string = MakerId> = {
    vendors: readonly VendorAdapter<V>[];
    rules: readonly Rule<R>[];
    facts: readonly FactsEntry<M>[];
    makers: readonly Maker<M>[];
};
export declare const DEFAULT_REGISTRY: Registry;
/** Handshake, probes, every enabled rule, verdict. */
export declare function verifyWith<V extends string, R extends string, M extends string = MakerId>(registry: Registry<V, R, M>, opts: VerifyOptions<V>): Promise<VerifyResult<V, R, M>>;
/**
 * Judge chosen rules on a wire the caller already knows works: no handshake,
 * no verdict, only the evidence those rules ask for. A rule named here runs
 * whether or not its `checks` switch is on; `checks` still carries options.
 */
export declare function runRulesWith<V extends string, R extends string, M extends string = MakerId>(registry: Registry<V, R, M>, opts: VerifyOptions<V> & {
    only: readonly R[];
}): Promise<RuleRun<R>>;
export declare const verify: (opts: VerifyOptions) => Promise<VerifyResult<"anthropic" | "gemini" | "openai", "answer-fingerprint" | "cjk-leak" | "coding-tool" | "envelope" | "foreign" | "mux" | "quorum" | "scam" | "served-model-mismatch" | "signature" | "substituted" | "survey" | "think-leak" | "thinking-floor" | "throughput" | "tier-self-report" | "token-truth" | "tokenizer-fingerprint" | "wrapper-leak", "ai21" | "aion" | "alibaba" | "amazon" | "anthropic" | "arcee" | "baidu" | "bytedance" | "cohere" | "deepseek" | "google" | "ibm" | "inception" | "inclusionai" | "internlm" | "jetbrains" | "kwaipilot" | "liquid" | "meituan" | "meta" | "microsoft" | "minimax" | "mistral" | "moondream" | "moonshot" | "nexagi" | "nous" | "nvidia" | "openai" | "openbmb" | "perplexity" | "poolside" | "rednote" | "sarvam" | "sensetime" | "stepfun" | "swissai" | "tencent" | "typhoon" | "venice" | "writer" | "xai" | "xiaomi" | "zhipu">>;
export declare const runRules: (opts: VerifyOptions & {
    only: readonly RuleId[];
}) => Promise<RuleRun<"answer-fingerprint" | "cjk-leak" | "coding-tool" | "envelope" | "foreign" | "mux" | "quorum" | "scam" | "served-model-mismatch" | "signature" | "substituted" | "survey" | "think-leak" | "thinking-floor" | "throughput" | "tier-self-report" | "token-truth" | "tokenizer-fingerprint" | "wrapper-leak">>;
/** One raw request through the run's transport and body extras, for callers with their own probes. */
export { callWire };
//# sourceMappingURL=verify.d.ts.map