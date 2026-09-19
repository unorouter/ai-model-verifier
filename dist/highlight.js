import { CJK_CHAR, CODING_TOOL_NAMES, CODING_TOOL_REFUSAL_PATTERNS, SCAM_PAGE_PATTERNS, } from "./identity/patterns";
import { MAKERS, makerFor } from "./makers/table";
import { resolveMaker } from "./makers/resolve";
import { VENDORS, vendorFor } from "./vendors/table";
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
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Maker words, on the boundaries `hasWord` uses. */
function collectWord(lower, words, kind) {
    const out = [];
    for (const word of words) {
        if (!word)
            continue;
        const re = new RegExp(`(?<![a-z0-9])${escapeRegExp(word.toLowerCase())}(?![a-z])`, "g");
        for (const m of lower.matchAll(re))
            out.push({ start: m.index, end: m.index + m[0].length, kind });
    }
    return out;
}
/**
 * Marks the phrases the signals react to, for a UI to colour a reply. `makerId`
 * is the result's maker; a wire id is accepted and stands for its default maker.
 */
export function highlightSpans(text, makerId, probeLabel) {
    if (!text)
        return [];
    const id = makerFor(MAKERS, makerId)
        ? makerId
        : vendorFor(VENDORS, makerId)?.defaultMaker;
    if (!id)
        return [{ text, kind: null }];
    const maker = resolveMaker(MAKERS, id);
    const lower = text.toLowerCase();
    const matches = [
        ...collectPhrase(lower, CODING_TOOL_NAMES, "coding-tool"),
        ...collectPhrase(lower, CODING_TOOL_REFUSAL_PATTERNS, "coding-tool"),
        ...collectPhrase(lower, SCAM_PAGE_PATTERNS, "scam"),
        ...collectWord(lower, maker.foreign, "foreign"),
        ...collectWord(lower, maker.home, "home"),
        ...collectWord(lower, maker.modelNames, "home"),
    ];
    if (probeLabel === "model-name")
        matches.push(...collectWord(lower, maker.cloudModelNames, "foreign"));
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