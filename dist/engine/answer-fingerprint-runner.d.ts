import { type FingerprintLabel } from "../probes/answer-fingerprint";
import { type RunCtx } from "./context";
export type FingerprintCellSample = {
    /** Canonical answer to how often it came. */
    answers: Record<string, number>;
    valid: number;
    refusal: number;
    invalid: number;
    empty: number;
    /** Transport or envelope errors, not answers. */
    errors: number;
};
/** Per cell counts from one run; merge runs with `mergeFingerprints`. */
export type FingerprintSample = {
    cells: Record<string, FingerprintCellSample>;
    calls: number;
    temperature: number;
    /** Raw replies of this run, capped, for the record. */
    raw?: {
        cell: FingerprintLabel;
        text: string | null;
        error?: string;
    }[];
    detectedModel: string | null;
    latencyMs: number;
};
export declare const emptyCell: () => FingerprintCellSample;
/**
 * Every call sequential: the marketplaces throttle per account and the
 * caller's pacing may not know this host. Lanes run in parallel elsewhere.
 */
export declare function collectAnswerFingerprint(ctx: RunCtx): Promise<FingerprintSample>;
//# sourceMappingURL=answer-fingerprint-runner.d.ts.map