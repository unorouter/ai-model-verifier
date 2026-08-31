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
}): Promise<VerifyResult>;
//# sourceMappingURL=runner.d.ts.map