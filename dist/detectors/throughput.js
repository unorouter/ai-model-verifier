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
export function sampleThroughput(args) {
    const tokens = args.outputTokens;
    // A handful of tokens over a noisy connection says nothing; the rate is
    // dominated by connection setup rather than generation.
    if (typeof tokens !== "number" || tokens < 20)
        return null;
    if (!Number.isFinite(args.elapsedMs) || args.elapsedMs <= 0)
        return null;
    return {
        lane: args.lane,
        model: args.model,
        outputTokens: tokens,
        elapsedMs: args.elapsedMs,
        tokensPerSecond: +(tokens / (args.elapsedMs / 1000)).toFixed(1),
    };
}
const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
/**
 * Describe how lanes serving one model compare. `outlierRatio` is how far from
 * the median a lane must sit to be worth mentioning; the default of 2 is a
 * starting point for eyeballing, not a calibrated threshold.
 */
export function compareThroughput(samples, opts) {
    const ratio = opts?.outlierRatio ?? 2;
    const byModel = new Map();
    for (const s of samples) {
        const list = byModel.get(s.model);
        if (list)
            list.push(s);
        else
            byModel.set(s.model, [s]);
    }
    const out = [];
    for (const [model, group] of byModel) {
        // Below three lanes there is no distribution to speak of, so report the
        // median and no outliers rather than inventing a comparison.
        const med = median(group.map((s) => s.tokensPerSecond));
        const outliers = group.length >= 3
            ? group
                .filter((s) => s.tokensPerSecond >= med * ratio ||
                s.tokensPerSecond <= med / ratio)
                .map((s) => ({
                lane: s.lane,
                tokensPerSecond: s.tokensPerSecond,
                ratioToMedian: +(s.tokensPerSecond / med).toFixed(2),
                direction: s.tokensPerSecond > med ? "faster" : "slower",
            }))
                .sort((a, b) => b.tokensPerSecond - a.tokensPerSecond)
            : [];
        out.push({
            model,
            sampleCount: group.length,
            medianTps: +med.toFixed(1),
            outliers,
            note: group.length < 3
                ? "too few lanes to compare"
                : outliers.length === 0
                    ? "all lanes within range of each other"
                    : `${outliers.length} lane(s) far from the median; a much faster lane can mean a smaller model, but load and quantisation move this too`,
        });
    }
    return out;
}
//# sourceMappingURL=throughput.js.map