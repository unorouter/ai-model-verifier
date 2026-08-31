/**
 * Throughput metadata: tokens per second, derived from data the run already
 * collected.
 *
 * Motivation: bigger models are slower per token, so a lane billed as Opus but
 * served by Sonnet tends to run fast. That makes throughput the one tier signal
 * that survives a relay refusing to name its model.
 *
 * It is metadata, not a verdict, and deliberately has no thresholds. Rate
 * varies with load, batching, quantisation and time of day, so a single
 * measurement cannot separate "cheaper model" from "quiet hour". The useful
 * comparison is across lanes serving the SAME model, which only the caller can
 * assemble: `compareThroughput` does that part and still only describes what it
 * sees.
 */
export type ThroughputSample = {
    /** Identifies the lane in the caller's own terms. */
    lane: string;
    model: string;
    outputTokens: number;
    elapsedMs: number;
    tokensPerSecond: number;
};
export declare function sampleThroughput(args: {
    lane: string;
    model: string;
    outputTokens: number | null | undefined;
    elapsedMs: number;
}): ThroughputSample | null;
export type ThroughputComparison = {
    model: string;
    sampleCount: number;
    medianTps: number;
    /** Lanes running far from the median for this model, fastest first. */
    outliers: {
        lane: string;
        tokensPerSecond: number;
        ratioToMedian: number;
        direction: "faster" | "slower";
    }[];
    note: string;
};
/**
 * Describe how lanes serving one model compare. `outlierRatio` is how far from
 * the median a lane must sit to be worth mentioning; the default of 2 is a
 * starting point for eyeballing, not a calibrated threshold.
 */
export declare function compareThroughput(samples: ThroughputSample[], opts?: {
    outlierRatio?: number;
}): ThroughputComparison[];
//# sourceMappingURL=throughput.d.ts.map