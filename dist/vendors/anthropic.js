import { intOf, rec } from "../internal/utils";
import { foreignPatternsExcept } from "../identity/patterns";
import { normalizeBaseUrl } from "./base-url";
import { defineVendor, } from "./types";
// Anthropic refuses a browser preflight unless the caller opts in with this
// header, and every relay that reimplements their API inherits the rule. The
// header is meaningless to endpoints that do not check it, so it goes on every
// direct probe rather than guessing which hosts enforce it.
const BROWSER_ACCESS_HEADER = "anthropic-dangerous-direct-browser-access";
function headers(ctx) {
    const h = {
        "content-type": "application/json",
        "x-api-key": ctx.apiKey,
        "anthropic-version": "2023-06-01",
    };
    if (ctx.direct)
        h[BROWSER_ACCESS_HEADER] = "true";
    return h;
}
const blocksOf = (data) => {
    const d = rec(data) ?? {};
    return Array.isArray(d.content)
        ? d.content.filter((b) => !!b && typeof b === "object")
        : [];
};
function chat(req, ctx) {
    const body = {
        model: req.model,
        max_tokens: req.maxTokens,
        messages: req.messages,
    };
    if (req.thinking) {
        body["thinking"] =
            req.thinking.kind === "extended"
                ? { type: "enabled", budget_tokens: req.thinking.budgetTokens }
                : { type: "adaptive", display: "summarized" };
        // Sibling of `thinking`, never nested inside it: nesting is a 400.
        if (req.thinking.kind === "adaptive")
            body["output_config"] = { effort: "xhigh" };
    }
    return {
        url: `${normalizeBaseUrl(ctx.baseUrl)}/v1/messages`,
        headers: headers(ctx),
        body,
    };
}
function countTokens(req, ctx) {
    return {
        url: `${normalizeBaseUrl(ctx.baseUrl)}/v1/messages/count_tokens`,
        headers: headers(ctx),
        body: { model: req.model, messages: req.messages },
    };
}
function text(data) {
    const d = rec(data) ?? {};
    if (d.type === "error")
        return null;
    return blocksOf(data)
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join(" ")
        .toLowerCase();
}
function meta(data) {
    const d = rec(data) ?? {};
    const u = d.usage;
    const prompt = intOf(u?.input_tokens);
    const completion = intOf(u?.output_tokens);
    return {
        detectedModel: typeof d.model === "string" ? d.model : null,
        usage: u
            ? {
                prompt,
                completion,
                total: prompt !== null && completion !== null ? prompt + completion : null,
            }
            : null,
    };
}
function thinkingBlock(data) {
    for (const b of blocksOf(data)) {
        if (b.type !== "thinking" && b.type !== "redacted_thinking")
            continue;
        return {
            block: b,
            signature: typeof b.signature === "string" ? b.signature : "",
            chars: typeof b.thinking === "string" ? b.thinking.length : 0,
        };
    }
    return null;
}
function countedTokens(data) {
    const d = rec(data) ?? {};
    return intOf(d.input_tokens);
}
export const anthropicVendor = defineVendor({
    id: "anthropic",
    vendorName: "anthropic",
    envelope: "anthropic",
    fallbackWires: ["openai"],
    ops: { chat, countTokens },
    read: { text, meta, thinkingBlock, countedTokens },
    identity: {
        home: ["anthropic"],
        foreign: foreignPatternsExcept("anthropic"),
        homeModelNames: ["claude", "anthropic"],
        cloudModelNames: ["amazon q", "q developer", "kiro"],
        acceptsCloudHost: true,
    },
    // `fable` is load-bearing: without it tierOf() returns null for
    // claude-fable-5 and a relay serving opus under a fable label is never checked.
    tiers: ["opus", "sonnet", "haiku", "fable"],
});
//# sourceMappingURL=anthropic.js.map