/**
 * Thinking floor for models that cannot switch reasoning off.
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
 * `completion_tokens: 1`, and it still echoes `model: gemini-2.5-pro`, so the
 * substitution rule never fires. The token count is the only free evidence left.
 */
import { intOf, rec } from "../internal/utils";
import { normalizeModelId, resolveModelFacts } from "../models/facts";
import { defineRule } from "./types";
export const DEFAULT_MIN_COMPLETION_TOKENS = 10;
export const alwaysThinksEntries = (models = []) => models.map((p) => ({ match: `${normalizeModelId(p)}*`, alwaysThinks: true }));
export function mustAlwaysThink(model, options) {
    return resolveModelFacts(model, alwaysThinksEntries(options?.models))
        .alwaysThinks;
}
/** Completion and reasoning counts from an OpenAI `usage` or a Gemini `usageMetadata`. */
export function readThinkingUsage(data) {
    const d = rec(data);
    const u = rec(d?.["usage"] ?? d?.["usageMetadata"]);
    if (!u)
        return null;
    const details = rec(u["completion_tokens_details"]);
    return {
        reasoning: intOf(details?.["reasoning_tokens"]) ?? intOf(u["thoughtsTokenCount"]),
        completion: intOf(u["completion_tokens"]) ?? intOf(u["candidatesTokenCount"]),
    };
}
export function judgeReasoningUsage(usage, floor) {
    if (!usage)
        return {
            state: "unmeasured",
            completionTokens: null,
            reasoningTokens: null,
            reason: "no usage in reply",
        };
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
const SKIPPED = {
    state: "skipped",
    completionTokens: null,
    reasoningTokens: null,
};
/** Judge one reply to the short probe. Pure: pass any response body already collected. */
export function judgeThinkingFloor(model, data, options) {
    if (!mustAlwaysThink(model, options))
        return SKIPPED;
    return judgeReasoningUsage(readThinkingUsage(data), options?.minCompletionTokens ?? DEFAULT_MIN_COMPLETION_TOKENS);
}
async function floorResult(ctx) {
    const res = await ctx.evidence("floorReply");
    if (!res)
        return SKIPPED;
    if (res.status !== 200 || !res.data)
        return {
            state: "unmeasured",
            completionTokens: null,
            reasoningTokens: null,
            reason: res.error ?? `http ${res.status ?? "none"}`,
        };
    return judgeReasoningUsage(ctx.wire.read.reasoningUsage?.(res.data) ?? null, ctx.checks.thinkingFloor?.minCompletionTokens ??
        DEFAULT_MIN_COMPLETION_TOKENS);
}
export const thinkingFloorRule = defineRule({
    id: "thinking-floor",
    layer: "evidence",
    needs: ["floorReply"],
    check: "thinkingFloor",
    applies: (ctx) => ctx.wire.read.reasoningUsage !== undefined,
    judge: async (ctx) => {
        const r = await floorResult(ctx);
        return r.state === "no-thinking"
            ? { severity: "fail", reason: `no-thinking: ${r.reason}`, data: r }
            : null;
    },
    report: async (ctx) => ({ thinkingFloor: await floorResult(ctx) }),
});
//# sourceMappingURL=thinking-floor.js.map