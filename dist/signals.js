import { CJK_CHAR, CJK_LEAK_MIN_CHARS, CLOUD_HOST_PATTERNS, CODING_TOOL_NAMES, CODING_TOOL_REFUSAL_PATTERNS, SCAM_PAGE_PATTERNS, } from "./patterns";
export const includesAny = (text, patterns) => patterns.some((p) => text.includes(p));
export const hasCodingToolRefusal = (text) => includesAny(text, CODING_TOOL_NAMES) ||
    includesAny(text, CODING_TOOL_REFUSAL_PATTERNS);
export const hasScamPage = (text) => includesAny(text, SCAM_PAGE_PATTERNS);
export function cjkLeak(text) {
    const m = text.match(CJK_CHAR);
    return m !== null && m.length >= CJK_LEAK_MIN_CHARS;
}
export function hasForeignIdentity(text, foreignPatterns, cloudModelNamePatterns, probe) {
    if (includesAny(text, foreignPatterns))
        return true;
    if (probe === "model-name" && includesAny(text, cloudModelNamePatterns))
        return true;
    return false;
}
export function tierOf(text, tiers) {
    const found = tiers.filter((tier) => text.includes(tier));
    return found.length === 1 ? found[0] : null;
}
export function detectTierMismatch(requestedModel, modelNameText, tiers) {
    const reqTier = tierOf(requestedModel.toLowerCase(), tiers);
    if (!reqTier)
        return null;
    if (!modelNameText)
        return null;
    const saidTier = tierOf(modelNameText, tiers);
    if (saidTier && saidTier !== reqTier)
        return saidTier;
    return null;
}
export function detectSignal(text, probeLabel, foreignPatterns, cloudModelNamePatterns, acceptsCloudHostIdentity) {
    if (text.length === 0)
        return "blank";
    if (hasCodingToolRefusal(text))
        return "coding-tool";
    if (hasScamPage(text))
        return "scam";
    if (cjkLeak(text))
        return "cjk-leak";
    if (probeLabel === "identity" || probeLabel === "model-name") {
        if (hasForeignIdentity(text, foreignPatterns, cloudModelNamePatterns, probeLabel))
            return "foreign";
        if (probeLabel === "identity" &&
            acceptsCloudHostIdentity &&
            includesAny(text, CLOUD_HOST_PATTERNS))
            return "cloud-host";
    }
    return null;
}
const TRANSIENT_HTTP = [408, 425, 429, 500, 502, 503, 504, 520, 522, 524];
export function isTransientError(msg) {
    const m = msg.match(/HTTP (\d{3})/);
    if (m && TRANSIENT_HTTP.includes(Number(m[1])))
        return true;
    const lower = msg.toLowerCase();
    return (lower.includes("timeout") ||
        lower.includes("timed out") ||
        lower.includes("econnreset") ||
        lower.includes("socket") ||
        lower.includes("network") ||
        lower.includes("fetch failed"));
}
//# sourceMappingURL=signals.js.map