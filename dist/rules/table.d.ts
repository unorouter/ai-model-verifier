import type { Rule } from "./types";
/**
 * Precedence is this order: the first finding that is not a note decides the
 * verdict. Evidence rules sit above the probe ladder because they read facts a
 * coached reply cannot fake; note rules only report.
 */
export declare const RULES: readonly [Rule<"thinking-floor", "floorReply", "evidence">, Rule<"tokenizer-fingerprint", "fixedText", "evidence">, Rule<"coding-tool", "probes", "probe">, Rule<"scam", "probes", "probe">, Rule<"cjk-leak", "probes", "probe">, Rule<"mux", "probes", "probe">, Rule<"foreign", "probes", "probe">, Rule<"served-model-mismatch", "probes", "probe">, Rule<"substituted", "probes", "probe">, Rule<"quorum", "probes", "probe">, Rule<"tier-self-report", "probes", "note">, Rule<"signature", "thinkingReply", "note">, Rule<"token-truth", "countTokens" | "fixedText", "note">, Rule<"envelope", "probes", "note">, Rule<"throughput", "probes", "note">];
type RuleEntry = (typeof RULES)[number];
export type RuleId = RuleEntry["id"];
/** Rules that can decide a verdict; a UI naming every rule keys off this. */
export type VerdictRuleId = Extract<RuleEntry, {
    layer: "evidence" | "probe";
}>["id"];
export declare const DETECTION_RULES: readonly VerdictRuleId[];
export declare const DETECTION_EXCEPTIONS: readonly ["version", "transient", "cloud-host", "reshaping", "threshold"];
export type DetectionExceptionId = (typeof DETECTION_EXCEPTIONS)[number];
/** The rule a probe's signal feeds, for linking a probe row to a rule. */
export declare const RULE_FOR_SIGNAL: {
    readonly "coding-tool": "coding-tool";
    readonly scam: "scam";
    readonly "cjk-leak": "cjk-leak";
    readonly foreign: "foreign";
    readonly "cloud-host": null;
    readonly blank: "quorum";
};
export {};
//# sourceMappingURL=table.d.ts.map