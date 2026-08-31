import { rec } from "../internal/utils";
import { foreignPatternsExcept } from "../patterns";
import { normalizeProbeBaseUrl, } from "./config";
const REASONING_MIN_OUTPUT_TOKENS = 2000;
const REASONING_MODEL = /^(?:o[1-9]|gpt-5)/i;
function buildRequest(args) {
    const maxCompletionTokens = REASONING_MODEL.test(args.model)
        ? Math.max(args.maxTokens, REASONING_MIN_OUTPUT_TOKENS)
        : args.maxTokens;
    return {
        url: `${normalizeProbeBaseUrl(args.baseUrl)}/v1/chat/completions`,
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${args.apiKey}`,
        },
        body: {
            model: args.model,
            max_completion_tokens: maxCompletionTokens,
            messages: [{ role: "user", content: args.prompt }],
        },
    };
}
function extractText(data) {
    const d = rec(data) ?? {};
    if (d.error)
        return null;
    const content = d.choices?.[0]?.message?.content;
    return typeof content === "string" ? content.toLowerCase() : null;
}
function extractMeta(data) {
    const d = rec(data) ?? {};
    const u = d.usage;
    return {
        detectedModel: d.model ?? null,
        usage: u
            ? {
                prompt: u.prompt_tokens ?? null,
                completion: u.completion_tokens ?? null,
                total: u.total_tokens ?? null,
            }
            : null,
    };
}
export const openaiConfig = {
    provider: "openai",
    buildRequest,
    extractText,
    extractMeta,
    homeIdentityPatterns: ["openai"],
    foreignIdentityPatterns: foreignPatternsExcept("openai"),
    homeModelNamePatterns: ["gpt", "openai", "o1", "o3", "o4"],
    cloudModelNamePatterns: [],
    tiers: null,
    acceptsCloudHostIdentity: false,
};
//# sourceMappingURL=openai.js.map