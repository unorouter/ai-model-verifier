import { rec } from "../internal/utils";
import { foreignPatternsExcept } from "../patterns";
import { normalizeProbeBaseUrl, } from "./config";
function isAnthropicHost(baseUrl) {
    try {
        return new URL(baseUrl).host.endsWith("api.anthropic.com");
    }
    catch {
        return false;
    }
}
function buildRequest(args) {
    const headers = {
        "content-type": "application/json",
        "x-api-key": args.apiKey,
        "anthropic-version": "2023-06-01",
    };
    if (args.direct && isAnthropicHost(args.baseUrl))
        headers["anthropic-dangerous-direct-browser-access"] = "true";
    return {
        url: `${normalizeProbeBaseUrl(args.baseUrl)}/v1/messages`,
        headers,
        body: {
            model: args.model,
            max_tokens: args.maxTokens,
            messages: [{ role: "user", content: args.prompt }],
        },
    };
}
function extractText(data) {
    const d = rec(data) ?? {};
    if (d.type === "error")
        return null;
    return (d.content ?? [])
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join(" ")
        .toLowerCase();
}
function extractMeta(data) {
    const d = rec(data) ?? {};
    const u = d.usage;
    const prompt = u?.input_tokens ?? null;
    const completion = u?.output_tokens ?? null;
    return {
        detectedModel: d.model ?? null,
        usage: u
            ? {
                prompt,
                completion,
                total: prompt !== null && completion !== null ? prompt + completion : null,
            }
            : null,
    };
}
export const anthropicConfig = {
    provider: "anthropic",
    buildRequest,
    extractText,
    extractMeta,
    homeIdentityPatterns: ["anthropic"],
    foreignIdentityPatterns: foreignPatternsExcept("anthropic"),
    homeModelNamePatterns: ["claude", "anthropic"],
    cloudModelNamePatterns: ["amazon q", "q developer", "kiro"],
    // `fable` is load-bearing: sync catches fable lanes served as sonnet, and a
    // tier list missing it makes that substitution undetectable here.
    tiers: ["opus", "sonnet", "haiku", "fable"],
    acceptsCloudHostIdentity: true,
};
//# sourceMappingURL=anthropic.js.map