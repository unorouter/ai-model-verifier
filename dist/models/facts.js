/**
 * Everything the engine knows about a model id, in one table. Adapters and rules
 * read facts; none of them carries a model-name regex of its own.
 *
 * Resolution is layered, first match per field: consumer entries, then this
 * table, in order. A field an entry leaves out falls through to later entries,
 * so a narrow entry (opus-4-7 thinks adaptively) sits above the broad one
 * (every claude belongs to anthropic) and both apply.
 */
import { MAKERS } from "../makers/table";
import { makerForModel } from "../makers/resolve";
/** Lowercase, `.` and `_` to `-`, any `vendor/` or `pool/` prefix stripped. */
export const normalizeModelId = (model) => model.trim().toLowerCase().replace(/[._]/g, "-").split("/").pop() ?? "";
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function globMatches(name, pattern) {
    const p = pattern.toLowerCase();
    if (!p.includes("*"))
        return name === p;
    return new RegExp(`^${p.split("*").map(escapeRegExp).join(".*")}$`).test(name);
}
export const MODEL_FACTS = [
    {
        match: ["claude-opus-4-7*", "claude-opus-4-8*"],
        thinking: "adaptive",
        tokenizer: "claude-v2",
    },
    {
        match: [
            "claude-opus-4-6*",
            "claude-opus-4-5*",
            "claude-opus-4-1*",
            "claude-sonnet-4-6*",
            "claude-sonnet-4-5*",
            "claude-haiku-4-5*",
        ],
        thinking: "extended",
    },
    { match: "*claude*", tokenizer: "claude-v1" },
    { match: "gemini-2-5-pro*", alwaysThinks: true },
    {
        match: [
            "gpt-5*",
            "o1*",
            "o2*",
            "o3*",
            "o4*",
            "o5*",
            "o6*",
            "o7*",
            "o8*",
            "o9*",
        ],
        minOutputTokens: 2000,
    },
];
export const defineModelFacts = (facts) => facts;
const DEFAULTS = {
    maker: null,
    thinking: "none",
    tokenizer: null,
    alwaysThinks: false,
    minOutputTokens: null,
};
const FACT_KEYS = [
    "maker",
    "thinking",
    "tokenizer",
    "alwaysThinks",
    "minOutputTokens",
];
function take(out, entry, key, seen) {
    const v = entry[key];
    if (seen.has(key) || v === undefined)
        return;
    out[key] = v;
    seen.add(key);
}
export function resolveModelFacts(model, extra = [], makers = MAKERS) {
    const id = normalizeModelId(model);
    const out = { ...DEFAULTS };
    const seen = new Set();
    for (const entry of [...extra, ...MODEL_FACTS]) {
        const patterns = typeof entry.match === "string" ? [entry.match] : entry.match;
        if (!patterns.some((p) => globMatches(id, p)))
            continue;
        for (const key of FACT_KEYS)
            take(out, entry, key, seen);
    }
    if (!seen.has("maker"))
        out.maker = makerForModel(id, makers);
    return out;
}
//# sourceMappingURL=facts.js.map