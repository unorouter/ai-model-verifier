import { type ThinkingFloorOptions } from "./detectors/thinking-floor";
import { type TransportFn } from "./transport";
import type { TransportMode, VerifyProvider, VerifyResult } from "./types";
export declare function runVerification(opts: {
    provider: VerifyProvider;
    baseUrl: string;
    apiKey: string;
    model: string;
    mode: TransportMode;
    timeoutMs?: number;
    transport?: TransportFn;
    /**
     * Run the Anthropic thinking-signature check too. Opt-in: it costs one extra
     * generation and only applies to Claude models that support thinking.
     */
    checkSignature?: boolean;
    /**
     * Verify the endpoint's token accounting (billing inflation, and the
     * tokenizer band that doubles as a tier check). Opt-in: three extra requests.
     */
    checkTokenTruth?: boolean;
    /**
     * For models that cannot switch thinking off (Gemini 2.5 Pro by default),
     * reject a reply with no reasoning tokens: a cheaper tier under the pro
     * name. Opt-in: one extra short generation. Pass options to change the
     * model list or the floor.
     */
    checkThinkingFloor?: boolean | ThinkingFloorOptions;
}): Promise<VerifyResult>;
//# sourceMappingURL=runner.d.ts.map