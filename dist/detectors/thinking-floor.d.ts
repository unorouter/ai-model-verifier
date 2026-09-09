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
import type { TransportFn } from "../transport";
export type ThinkingFloorOptions = {
    /**
     * Model id prefixes that must always think. Compared after lowercasing and
     * mapping `.`/`_` to `-`, provider prefix stripped.
     */
    models?: readonly string[];
    /** Below this many completion tokens with no reasoning count, the reply did not think. */
    minCompletionTokens?: number;
};
export declare const DEFAULT_ALWAYS_THINKS: readonly string[];
export declare const DEFAULT_MIN_COMPLETION_TOKENS = 10;
export type ThinkingFloorState = 
/** Reasoning tokens reported, or the completion count is above the floor. */
"thought"
/** A model that cannot skip thinking answered with no reasoning at all. */
 | "no-thinking"
/** No usage in the reply: nothing to judge. */
 | "unmeasured"
/** Model is not one that must always think. */
 | "skipped";
export type ThinkingFloorResult = {
    state: ThinkingFloorState;
    completionTokens: number | null;
    reasoningTokens: number | null;
    reason?: string;
};
export declare function mustAlwaysThink(model: string, options?: ThinkingFloorOptions): boolean;
/** Completion and reasoning counts from an OpenAI `usage` or a Gemini `usageMetadata`. */
export declare function readThinkingUsage(data: unknown): {
    completion: number | null;
    reasoning: number | null;
} | null;
/** Judge one reply to the short probe. Pure: pass any response body already collected. */
export declare function checkThinkingFloor(model: string, data: unknown, options?: ThinkingFloorOptions): ThinkingFloorResult;
/** One extra generation: the short prompt through the endpoint, then `checkThinkingFloor`. */
export declare function probeThinkingFloor(opts: {
    transport: TransportFn;
    baseUrl: string;
    apiKey: string;
    model: string;
    /** Wire shape of the endpoint. */
    provider: "openai" | "gemini";
    timeoutMs: number;
    options?: ThinkingFloorOptions;
}): Promise<ThinkingFloorResult>;
//# sourceMappingURL=thinking-floor.d.ts.map