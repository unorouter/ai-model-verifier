/**
 * Answer fingerprint: the distribution of one-word answers at temperature 1,
 * reported as counts and never judged here. A single run is 24 answers and
 * says nothing; a caller merges runs over days and compares the lane against
 * the profiles it trusts with the helpers below (Jensen-Shannon divergence in
 * bits, the thresholds of arXiv 2607.10252).
 */
import { type FingerprintSample } from "../engine/answer-fingerprint-runner";
export declare const DEFAULT_MATCH_BITS = 0.25;
export declare const DEFAULT_MISMATCH_BITS = 0.35;
export declare const DEFAULT_MIN_CELL_SAMPLES = 10;
export declare const DEFAULT_MIN_CELLS = 4;
export type CompareOptions = {
    matchBits?: number;
    mismatchBits?: number;
    minCellSamples?: number;
    minCells?: number;
};
export type CompareVerdict = "match" | "uncertain" | "mismatch" | "insufficient";
export type CompareResult = {
    jsd: number | null;
    cells: {
        label: string;
        jsd: number;
        samples: number;
        refSamples: number;
    }[];
    verdict: CompareVerdict;
};
export declare function mergeFingerprints(a: FingerprintSample, b: FingerprintSample): FingerprintSample;
/** Base 2, on two answer histograms; 0 identical, 1 disjoint. */
export declare function jensenShannon(p: Record<string, number>, q: Record<string, number>): number;
export declare function compareFingerprints(sample: FingerprintSample, reference: FingerprintSample, opts?: CompareOptions): CompareResult;
export type ProfileVerdict = "known" | "novel" | "uncertain" | "insufficient";
/** Best match over a set of accepted profiles (official route, known hosts). */
export declare function compareToProfiles(sample: FingerprintSample, profiles: readonly {
    name: string;
    sample: FingerprintSample;
}[], opts?: CompareOptions): {
    best: string | null;
    jsd: number | null;
    verdict: ProfileVerdict;
};
/** Greedy clustering by pairwise divergence; largest cluster first. */
export declare function fingerprintClusters(samples: Record<string, FingerprintSample>, threshold?: number, opts?: CompareOptions): {
    members: string[];
    pooled: FingerprintSample;
}[];
export declare const answerFingerprintRule: import("./types").Rule<"answer-fingerprint", "answerFingerprint", "note">;
//# sourceMappingURL=answer-fingerprint.d.ts.map