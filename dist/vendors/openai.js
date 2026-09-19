import { intOf, rec } from "../internal/utils";
import { normalizeBaseUrl } from "./base-url";
import { defineVendor, } from "./types";
function chat(req, ctx) {
    const min = ctx.facts.minOutputTokens;
    // Reasoning models refuse `max_tokens` and need room for hidden thought;
    // everything else gets the field every OpenAI-shaped relay understands.
    const limit = min === null
        ? { max_tokens: req.maxTokens }
        : { max_completion_tokens: Math.max(req.maxTokens, min) };
    return {
        url: `${normalizeBaseUrl(ctx.baseUrl)}/v1/chat/completions`,
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${ctx.apiKey}`,
        },
        body: { model: req.model, ...limit, messages: req.messages },
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
    read: { text, meta, reasoningUsage },
    defaultMaker: "openai",
});
//# sourceMappingURL=openai.js.map