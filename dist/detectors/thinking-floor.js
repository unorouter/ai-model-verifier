/**
 * Thinking-floor check for models that cannot switch reasoning off.
 *
 * Gemini 2.5 Pro has a thinking budget floor (128 tokens): even "Reply with
 * only the word ok." produces hidden thought tokens, reported as
 * `completion_tokens_details.reasoning_tokens` on an OpenAI-shaped hop, folded
 * into `completion_tokens` when the relay strips the breakdown, or as
 * `usageMetadata.thoughtsTokenCount` on the native endpoint. Measured across 66
 * historical probes of genuine 2.5 Pro: the lowest completion count for that
 * prompt was 12, the native thoughts count 99 to 158.
 *
 * A flash-class backend sold under the pro name answers the same prompt with
 * `completion_tokens: 1` (a6 merchant 3623, 2026-09-09), and it still echoes
 * `model: gemini-2.5-pro`, so the envelope substitution check never fires.
 * The token count is the only free evidence left.
 *
 * Not applied to flash tiers: those may legitimately run with thinking off.
 */
export const DEFAULT_ALWAYS_THINKS = ["gemini-2-5-pro"];
export const DEFAULT_MIN_COMPLETION_TOKENS = 10;
const PROBE_PROMPT = "Reply with only the word ok.";
/** Room for the thoughts plus the word; too small truncates thinking and reads as a fake. */
const MAX_TOKENS = 2048;
const normalize = (model) => model.toLowerCase().replace(/[._]/g, "-").split("/").pop() ?? "";
export function mustAlwaysThink(model, options) {
    const m = normalize(model);
    return (options?.models ?? DEFAULT_ALWAYS_THINKS).some((p) => m.startsWith(normalize(p)));
}
const num = (v) => typeof v === "number" && Number.isFinite(v) ? v : null;
/** Completion and reasoning counts from an OpenAI `usage` or a Gemini `usageMetadata`. */
export function readThinkingUsage(data) {
    if (!data || typeof data !== "object")
        return null;
    const d = data;
    const u = (d.usage ?? d.usageMetadata);
    if (!u || typeof u !== "object")
        return null;
    const details = u.completion_tokens_details;
    const reasoning = num(details && typeof details === "object" ? details.reasoning_tokens : null) ??
        num(u.thoughtsTokenCount);
    const completion = num(u.completion_tokens) ?? num(u.candidatesTokenCount);
    return { completion, reasoning };
}
/** Judge one reply to the short probe. Pure: pass any response body already collected. */
export function checkThinkingFloor(model, data, options) {
    if (!mustAlwaysThink(model, options))
        return { state: "skipped", completionTokens: null, reasoningTokens: null };
    const usage = readThinkingUsage(data);
    if (!usage)
        return {
            state: "unmeasured",
            completionTokens: null,
            reasoningTokens: null,
            reason: "no usage in reply",
        };
    const floor = options?.minCompletionTokens ?? DEFAULT_MIN_COMPLETION_TOKENS;
    if (usage.reasoning !== null && usage.reasoning > 0)
        return {
            state: "thought",
            completionTokens: usage.completion,
            reasoningTokens: usage.reasoning,
        };
    if (usage.completion === null)
        return {
            state: "unmeasured",
            completionTokens: null,
            reasoningTokens: usage.reasoning,
            reason: "no completion count in usage",
        };
    // An empty reply carries no evidence: nothing was generated, so nothing was
    // skipped. Truncation and refusals land here, not in "no-thinking".
    if (usage.completion === 0)
        return {
            state: "unmeasured",
            completionTokens: 0,
            reasoningTokens: usage.reasoning,
            reason: "empty reply",
        };
    if (usage.completion < floor)
        return {
            state: "no-thinking",
            completionTokens: usage.completion,
            reasoningTokens: usage.reasoning,
            reason: `completion_tokens ${usage.completion} below floor ${floor} with no reasoning tokens`,
        };
    return {
        state: "thought",
        completionTokens: usage.completion,
        reasoningTokens: usage.reasoning,
    };
}
/** One extra generation: the short prompt through the endpoint, then `checkThinkingFloor`. */
export async function probeThinkingFloor(opts) {
    if (!mustAlwaysThink(opts.model, opts.options))
        return { state: "skipped", completionTokens: null, reasoningTokens: null };
    const base = opts.baseUrl.replace(/\/+$/, "");
    const req = opts.provider === "gemini"
        ? {
            url: `${base}/v1beta/models/${opts.model}:generateContent`,
            headers: {
                "content-type": "application/json",
                "x-goog-api-key": opts.apiKey,
            },
            reqBody: {
                contents: [{ role: "user", parts: [{ text: PROBE_PROMPT }] }],
                generationConfig: { maxOutputTokens: MAX_TOKENS },
            },
        }
        : {
            url: `${base}/v1/chat/completions`,
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${opts.apiKey}`,
            },
            reqBody: {
                model: opts.model,
                max_tokens: MAX_TOKENS,
                messages: [{ role: "user", content: PROBE_PROMPT }],
            },
        };
    const res = await opts.transport({
        mode: "direct",
        ...req,
        timeoutMs: opts.timeoutMs,
    });
    if (res.status !== 200 || !res.data)
        return {
            state: "unmeasured",
            completionTokens: null,
            reasoningTokens: null,
            reason: res.error ?? `http ${res.status ?? "none"}`,
        };
    return checkThinkingFloor(opts.model, res.data, opts.options);
}
//# sourceMappingURL=thinking-floor.js.map