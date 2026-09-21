import { intOf, rec } from "../internal/utils";
import { normalizeBaseUrl } from "./base-url";
import { defineVendor, } from "./types";
/** A thinking budget would otherwise eat the whole output cap. */
const MIN_OUTPUT_TOKENS = 1024;
function chat(req, ctx) {
    return {
        url: `${normalizeBaseUrl(ctx.baseUrl)}/v1beta/models/${req.model}:generateContent`,
        headers: {
            "content-type": "application/json",
            "x-goog-api-key": ctx.apiKey,
        },
        body: {
            contents: req.messages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: typeof m.content === "string" ? [{ text: m.content }] : m.content,
            })),
            generationConfig: {
                maxOutputTokens: Math.max(req.maxTokens, MIN_OUTPUT_TOKENS),
                ...(req.temperature !== undefined
                    ? { temperature: req.temperature }
                    : {}),
                ...(req.topP !== undefined ? { topP: req.topP } : {}),
                ...(req.seed !== undefined ? { seed: req.seed } : {}),
            },
        },
    };
}
function text(data) {
    const d = rec(data) ?? {};
    if (d.error)
        return null;
    const parts = d.candidates?.[0]?.content?.parts;
    if (!parts)
        return null;
    return parts
        .map((p) => p.text ?? "")
        .join(" ")
        .toLowerCase();
}
function meta(data) {
    const d = rec(data) ?? {};
    const u = d.usageMetadata;
    return {
        detectedModel: typeof d.modelVersion === "string" ? d.modelVersion : null,
        usage: u
            ? {
                prompt: intOf(u.promptTokenCount),
                completion: intOf(u.candidatesTokenCount),
                total: intOf(u.totalTokenCount),
            }
            : null,
    };
}
function reasoningUsage(data) {
    const d = rec(data) ?? {};
    const u = d.usageMetadata;
    if (!u || typeof u !== "object")
        return null;
    return {
        completion: intOf(u.candidatesTokenCount),
        reasoning: intOf(u.thoughtsTokenCount),
    };
}
export const geminiVendor = defineVendor({
    id: "gemini",
    vendorName: "google",
    envelope: "gemini",
    fallbackWires: ["openai"],
    ops: { chat },
    read: { text, meta, reasoningUsage },
    defaultMaker: "google",
});
//# sourceMappingURL=gemini.js.map