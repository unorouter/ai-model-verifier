export const DETECTION_RULES = [
    "coding-tool",
    "scam",
    "cjk-leak",
    "mux",
    "foreign",
    "tier-mismatch",
    "substituted",
];
export const DETECTION_EXCEPTIONS = [
    "version",
    "transient",
    "cloud-host",
    "reshaping",
    "threshold",
];
export function ruleIdForSignal(signal) {
    if (signal === "coding-tool")
        return "coding-tool";
    if (signal === "scam")
        return "scam";
    if (signal === "cjk-leak")
        return "cjk-leak";
    if (signal === "foreign")
        return "foreign";
    return null;
}
//# sourceMappingURL=rules.js.map