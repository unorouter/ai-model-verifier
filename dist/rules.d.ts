export type DetectionRuleId = "coding-tool" | "scam" | "cjk-leak" | "mux" | "foreign" | "tier-mismatch" | "substituted";
export declare const DETECTION_RULES: readonly DetectionRuleId[];
export type DetectionExceptionId = "version" | "transient" | "cloud-host" | "reshaping" | "threshold";
export declare const DETECTION_EXCEPTIONS: readonly DetectionExceptionId[];
export declare function ruleIdForSignal(signal: string): DetectionRuleId | null;
//# sourceMappingURL=rules.d.ts.map