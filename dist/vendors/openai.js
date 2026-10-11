import { intOf, rec, strOf } from "../internal/utils";
import { normalizeBaseUrl } from "./base-url";
import { defineVendor, } from "./types";
function chat(req, ctx) {
    const min = ctx.facts.minOutputTokens;
    // Thinking models need room for hidden thought. OpenAI's own refuse
    // `max_tokens` and Google's accept either, so those two get
    // `max_completion_tokens`; the open-weight makers are sold through relays
    // that only know `max_tokens`, which is raised instead.
    const limit = min === null
        ? { max_tokens: req.maxTokens }
        : ctx.facts.maker === "openai" || ctx.facts.maker === "google"
            ? { max_completion_tokens: Math.max(req.maxTokens, min) }
            : { max_tokens: Math.max(req.maxTokens, min) };
    return {
        url: `${normalizeBaseUrl(ctx.baseUrl)}/v1/chat/completions`,
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${ctx.apiKey}`,
        },
        body: {
            model: req.model,
            ...limit,
            messages: req.messages,
            ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
            ...(req.topP !== undefined ? { top_p: req.topP } : {}),
            ...(req.seed !== undefined ? { seed: req.seed } : {}),
        },
    };
}
function text(data) {
    const d = rec(data) ?? {};
    if (d.error)
        return null;
    const content = d.choices?.[0]?.message?.content;
    if (typeof content === "string")
        return content.toLowerCase();
    if (Array.isArray(content))
        return content
            .filter((b) => b.type === "text")
            .map((b) => b.text ?? "")
            .join(" ")
            .toLowerCase();
    return null;
}
// Relays spell visible reasoning three ways: DeepSeek's reasoning_content,
// OpenRouter's reasoning string, and its reasoning_details array.
function reasoningText(data) {
    const d = rec(data) ?? {};
    const m = d.choices?.[0]?.message;
    if (!m)
        return null;
    const parts = [];
    for (const v of [m.reasoning_content, m.reasoning])
        if (typeof v === "string" && v.trim())
            parts.push(v);
    for (const r of m.reasoning_details ?? [])
        for (const v of [r?.text, r?.summary])
            if (typeof v === "string" && v.trim())
                parts.push(v);
    return parts.length > 0 ? parts.join(" ").toLowerCase() : null;
}
function meta(data) {
    const d = rec(data) ?? {};
    const u = d.usage;
    return {
        detectedModel: typeof d.model === "string" ? d.model : null,
        usage: u
            ? {
                prompt: intOf(u.prompt_tokens),
                completion: intOf(u.completion_tokens),
                total: intOf(u.total_tokens),
            }
            : null,
        finishReason: strOf(d.choices?.[0]?.finish_reason),
    };
}
function reasoningUsage(data) {
    const d = rec(data) ?? {};
    const u = d.usage;
    if (!u || typeof u !== "object")
        return null;
    const details = u.completion_tokens_details;
    return {
        completion: intOf(u.completion_tokens),
        reasoning: intOf(details && typeof details === "object" ? details.reasoning_tokens : null),
    };
}
export const openaiVendor = defineVendor({
    id: "openai",
    vendorName: "openai",
    envelope: "openai",
    fallbackWires: [],
    ops: { chat },
    read: { text, meta, reasoningUsage, reasoningText },
    defaultMaker: "openai",
});
//# sourceMappingURL=openai.js.map