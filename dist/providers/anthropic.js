import { rec } from "../internal/utils";
import { foreignPatternsExcept } from "../patterns";
import { normalizeProbeBaseUrl, } from "./config";
// Anthropic refuses a browser preflight unless the caller opts in with this
// header, and every relay that reimplements their API inherits the rule. The
// header is meaningless to endpoints that do not check it, so send it on every
// direct Anthropic-format probe rather than guessing which hosts enforce it.
const BROWSER_ACCESS_HEADER = "anthropic-dangerous-direct-browser-access";
function buildRequest(args) {
    const headers = {
        "content-type": "application/json",
        "x-api-key": args.apiKey,
        "anthropic-version": "2023-06-01",
    };
    if (args.direct)
        headers[BROWSER_ACCESS_HEADER] = "true";
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