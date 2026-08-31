import { CJK_CHAR, CODING_TOOL_NAMES, CODING_TOOL_REFUSAL_PATTERNS, SCAM_PAGE_PATTERNS, } from "./patterns";
import { PROVIDER_CONFIGS } from "./providers/config";
function collectPhrase(lower, phrases, kind) {
    const out = [];
    for (const phrase of phrases) {
        if (!phrase)
            continue;
        const needle = phrase.toLowerCase();
        let from = 0;
        for (;;) {
            const idx = lower.indexOf(needle, from);
            if (idx === -1)
                break;
            out.push({ start: idx, end: idx + needle.length, kind });
            from = idx + needle.length;
        }
    }
    return out;
}
export function highlightSpans(text, providerKind, probeLabel) {
    if (!text)
        return [];
    const cfg = PROVIDER_CONFIGS[providerKind];
    if (!cfg)
        return [{ text, kind: null }];
    const lower = text.toLowerCase();
    const matches = [
        ...collectPhrase(lower, CODING_TOOL_NAMES, "coding-tool"),
        ...collectPhrase(lower, CODING_TOOL_REFUSAL_PATTERNS, "coding-tool"),
        ...collectPhrase(lower, SCAM_PAGE_PATTERNS, "scam"),
        ...collectPhrase(lower, cfg.foreignIdentityPatterns, "foreign"),
        ...collectPhrase(lower, cfg.homeIdentityPatterns, "home"),
        ...collectPhrase(lower, cfg.homeModelNamePatterns, "home"),
    ];
    if (probeLabel === "model-name")
        matches.push(...collectPhrase(lower, cfg.cloudModelNamePatterns, "foreign"));
    for (const m of text.matchAll(CJK_CHAR))
        if (m.index !== undefined)
            matches.push({ start: m.index, end: m.index + m[0].length, kind: "cjk" });
    if (matches.length === 0)
        return [{ text, kind: null }];
    matches.sort((a, b) => a.start - b.start || b.end - a.end);
    const merged = [];
    let cursor = 0;
    for (const m of matches) {
        if (m.start < cursor)
            continue;
        merged.push(m);
        cursor = m.end;
    }
    const segments = [];
    let pos = 0;
    for (const m of merged) {
        if (m.start > pos)
            segments.push({ text: text.slice(pos, m.start), kind: null });
        segments.push({ text: text.slice(m.start, m.end), kind: m.kind });
        pos = m.end;
    }
    if (pos < text.length)
        segments.push({ text: text.slice(pos), kind: null });
    return segments;
}
//# sourceMappingURL=highlight.js.map