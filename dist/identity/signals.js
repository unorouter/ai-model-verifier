import { CJK_CHAR, CJK_LEAK_MIN_CHARS, CLOUD_HOST_PATTERNS, CODING_TOOL_NAMES, CODING_TOOL_REFUSAL_PATTERNS, SCAM_PAGE_PATTERNS, } from "./patterns";
export const includesAny = (text, patterns) => patterns.some((p) => text.includes(p));
const includesAnyWord = (text, words) => words.some((w) => new RegExp(`\\b${w}\\b`).test(text));
export const hasCodingToolRefusal = (text) => includesAnyWord(text, CODING_TOOL_NAMES) ||
    includesAny(text, CODING_TOOL_REFUSAL_PATTERNS);
export const hasScamPage = (text) => includesAny(text, SCAM_PAGE_PATTERNS);
/**
 * English prompts expect English answers; a substituted or distilled Chinese
 * model (or a corrupting proxy) leaks CJK into the reply even when it has
 * learned to say "anthropic".
 */
export function cjkLeak(text) {
    const m = text.match(CJK_CHAR);
    return m !== null && m.length >= CJK_LEAK_MIN_CHARS;
}
export function hasForeignIdentity(text, identity, probe) {
    if (includesAny(text, identity.foreign))
        return true;
    if (probe === "model-name" && includesAny(text, identity.cloudModelNames))
        return true;
    return false;
}
export function detectSignal(text, probe, identity) {
    if (text.length === 0)
        return "blank";
    if (hasCodingToolRefusal(text))
        return "coding-tool";
    if (hasScamPage(text))
        return "scam";
    if (cjkLeak(text))
        return "cjk-leak";
    if (probe === "identity" || probe === "model-name") {
        if (hasForeignIdentity(text, identity, probe))
            return "foreign";
        if (probe === "identity" &&
            identity.acceptsCloudHost &&
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