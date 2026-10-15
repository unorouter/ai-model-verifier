/**
 * Thinking honoured for models that think only when asked.
 *
 * Gemini 4 skips thinking at low and medium effort, so the always-thinks floor
 * cannot judge it. Asked for high effort on a small reasoning question, Google's
 * own route spent 304 to 360 thought tokens; a7 merchants selling the same id
 * answered with 0 (the effort dropped on the way) or 47 to 59 (downgraded to low).
 * Users saw the difference as short, flat replies on the cheap lanes.
 *
 * Reasoning tokens count when the reply reports them; otherwise the completion
 * count stands in, since a relay that folds thoughts into the answer still bills
 * them there.
 */
import { defineRule } from "./types";
/** A third of the lowest genuine high-effort count, room for shorter thoughts. */
export const MIN_ASKED_THINKING_TOKENS = 100;
const SKIPPED = {
    state: "skipped",
    thinkingTokens: null,
    reasoningTokens: null,
    completionTokens: null,
};
/** Judge one reply to the high-effort probe. Pure: pass the usage already read. */
export function judgeThinkingHonored(usage, min = MIN_ASKED_THINKING_TOKENS) {
    if (!usage || (usage.reasoning === null && usage.completion === null))
        return { ...SKIPPED, state: "unmeasured", reason: "no usage in reply" };
    const thinking = usage.reasoning !== null && usage.reasoning > 0
        ? usage.reasoning
        : usage.completion;
    const base = {
        thinkingTokens: thinking,
        reasoningTokens: usage.reasoning,
        completionTokens: usage.completion,
    };
    if (thinking === null || thinking === 0)
        return thinking === 0 && usage.completion === 0
            ? { state: "unmeasured", ...base, reason: "empty reply" }
            : {
                state: "ignored",
                ...base,
                reason: "asked for high effort, the reply carried no thought tokens",
            };
    if (thinking < min)
        return {
            state: "ignored",
            ...base,
            reason: `asked for high effort, ${thinking} thought tokens is below ${min}`,
        };
    return { state: "thought", ...base };
}
async function honoredResult(ctx) {
    const res = await ctx.evidence("askedThinkingReply");
    if (!res)
        return SKIPPED;
    if (res.status !== 200 || !res.data)
        return {
            ...SKIPPED,
            state: "unmeasured",
            reason: res.error ?? `http ${res.status ?? "none"}`,
        };
    return judgeThinkingHonored(ctx.wire.read.reasoningUsage?.(res.data) ?? null);
}
export const thinkingHonoredRule = defineRule({
    id: "thinking-honored",
    layer: "evidence",
    needs: ["askedThinkingReply"],
    check: "thinkingFloor",
    applies: (ctx) => ctx.facts.thinksWhenAsked && ctx.wire.read.reasoningUsage !== undefined,
    judge: async (ctx) => {
        const r = await honoredResult(ctx);
        return r.state === "ignored"
            ? { severity: "fail", reason: `thinking-ignored: ${r.reason}`, data: r }
            : null;
    },
    report: async (ctx) => ({ thinkingHonored: await honoredResult(ctx) }),
});
//# sourceMappingURL=thinking-honored.js.map