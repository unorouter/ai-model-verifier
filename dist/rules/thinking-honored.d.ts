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
/** A third of the lowest genuine high-effort count, room for shorter thoughts. */
export declare const MIN_ASKED_THINKING_TOKENS = 100;
export type ThinkingHonoredState = "thought"
/** Asked for high effort, the reply carried too little thought to have honoured it. */
 | "ignored"
/** No usage, or the request failed: nothing to judge. */
 | "unmeasured"
/** Model is not one that thinks only when asked. */
 | "skipped";
export type ThinkingHonoredResult = {
    state: ThinkingHonoredState;
    thinkingTokens: number | null;
    reasoningTokens: number | null;
    completionTokens: number | null;
    reason?: string;
};
/** Judge one reply to the high-effort probe. Pure: pass the usage already read. */
export declare function judgeThinkingHonored(usage: {
    reasoning: number | null;
    completion: number | null;
} | null, min?: number): ThinkingHonoredResult;
export declare const thinkingHonoredRule: import("./types").Rule<"thinking-honored", "askedThinkingReply", "evidence">;
//# sourceMappingURL=thinking-honored.d.ts.map