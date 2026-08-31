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
}): Promise<VerifyResult>;
//# sourceMappingURL=runner.d.ts.map