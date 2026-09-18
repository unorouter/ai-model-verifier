/**
 * Throughput metadata: tokens per second, derived from data the run already
 * collected.
 *
 * Bigger models are slower per token, so a lane billed as Opus but served by
 * Sonnet tends to run fast. That makes throughput the one tier signal that
 * survives a relay refusing to name its model. It is metadata, not a verdict,
 * and deliberately has no thresholds: rate varies with load, batching,
 * quantisation and time of day. The useful comparison is across lanes serving
 * the SAME model, which only the caller can assemble with `compareThroughput`.
 */
import { richestProbe } from "../engine/probe-runner";
import { hostOf } from "../internal/utils";
import { defineRule } from "./types";
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
                direction: s.tokensPerSecond > med
                    ? "faster"
                    : "slower",
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
export const throughputRule = defineRule({
    id: "throughput",
    layer: "note",
    needs: ["probes"],
    applies: () => true,
    judge: async () => null,
    report: async (ctx) => {
        const richest = richestProbe(await ctx.evidence("probes"));
        return richest
            ? {
                throughput: sampleThroughput({
                    lane: hostOf(ctx.baseUrl),
                    model: ctx.model,
                    outputTokens: richest.usage?.completion ?? null,
                    elapsedMs: richest.latencyMs,
                }),
            }
            : {};
    },
});
//# sourceMappingURL=throughput.js.map