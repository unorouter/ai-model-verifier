import type { ResponseMetadata } from "./detectors/response-metadata";
import type { ProviderConfig } from "./providers/config";
import type { ProbeOutcome, ProbeSignal, VerifyVerdict } from "./types";
/**
 * A probe's outcome plus the working values the runner needs but never stores:
 * the reply text, and the envelope facts read while the raw payload was still
 * in scope.
 */
export type ProbeEval = ProbeOutcome & {
    text: string | undefined;
    envelope?: ResponseMetadata;
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