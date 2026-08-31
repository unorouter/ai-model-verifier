import type { ProviderConfig } from "./providers/config";
import type { ProbeOutcome, ProbeSignal, VerifyVerdict } from "./types";
export type ProbeEval = ProbeOutcome & {
    text: string | undefined;
};
export type VerdictResult = {
    verdict: VerifyVerdict;
    reasons: string[];
    versionUnverifiable: boolean;
};
export declare function aggregateVerdict(args: {
    model: string;
    cfg: ProviderConfig;
    results: ProbeEval[];
    /** Model id echoed by the endpoint, when it reported one. */
    detectedModel?: string | null;
}): VerdictResult;
export declare function probeReason(pass: boolean, signal: ProbeSignal, muxFailure: boolean, transient: boolean): string;
//# sourceMappingURL=verdict.d.ts.map