/**
 * Tokenizer fingerprint: how many input tokens the endpoint bills for a fixed
 * run of text, measured as the difference between a long and a short prompt so
 * anything a relay injects cancels out.
 *
 * What it is good for: drift. The delta is deterministic per endpoint (68
 * marketplace lanes measured twice each agreed to the token on every repeat),
 * so a change between two measurements of the same lane means the backend
 * changed, whatever the reply now calls itself. Keep the prior per lane and
 * compare with `fingerprintDrifted`.
 *
 * What it is NOT good for: naming the tier from the number alone. Opus 4.6,
 * Sonnet 4.6 and Haiku 4.5 share one tokenizer, so they bill the same delta on
 * the same path, and relays count differently from each other (77, 90, 134,
 * 160, 211 and 609 were all seen for one text on lanes echoing one model name)
 * or invent usage outright. A signature table therefore ships EMPTY: only a
 * caller who has calibrated a table on a specific endpoint family should pass
 * one, and even then only between-model differences on the same endpoint are
 * evidence.
 */
import { defineRule } from "./types";
/** Empty on purpose; see the module note. Pass your own calibration. */
export const DEFAULT_TIER_SIGNATURES = {};
export function tierForDelta(delta, signatures = DEFAULT_TIER_SIGNATURES) {
    for (const [tier, values] of Object.entries(signatures))
        if (values.includes(delta))
            return tier;
    return null;
}
/**
 * The served tier when the fingerprint names one other than requested, or
 * null. `tiers` is the wire's tier vocabulary (opus, sonnet, haiku, fable).
 */
export function judgeTokenizerFingerprint(requestedModel, result, tiers) {
    if (result.state !== "measured" || result.matchedTier === null)
        return null;
    const req = requestedModel.toLowerCase();
    const reqTier = tiers.filter((t) => req.includes(t));
    if (reqTier.length !== 1)
        return null;
    return reqTier[0] === result.matchedTier ? null : result.matchedTier;
}
/** True when two measurements of the same lane disagree: the backend changed. */
export function fingerprintDrifted(prior, current) {
    return (typeof prior === "number" &&
        current.state === "measured" &&
        current.delta !== null &&
        current.delta !== prior);
}
async function fingerprintResult(ctx) {
    const ft = await ctx.evidence("fixedText");
    const empty = {
        delta: null,
        diverseDelta: null,
        shortInputTokens: null,
        longInputTokens: null,
        servedModel: null,
        matchedTier: null,
    };
    for (const r of [ft.short, ft.long])
        if (r.status === null || r.status >= 400)
            return {
                state: "unmeasured",
                ...empty,
                reason: `probe-failed:${r.status ?? "network"}`,
            };
    const shortMeta = ctx.wire.read.meta(ft.short.data);
    const short = shortMeta.usage?.prompt ?? null;
    const long = ctx.wire.read.meta(ft.long.data).usage?.prompt ?? null;
    if (short === null || long === null)
        return {
            state: "unmeasured",
            ...empty,
            servedModel: shortMeta.detectedModel,
            reason: "no-usage-reported",
        };
    const delta = long - short;
    // The diverse reply is best effort: a relay may refuse the mixed script.
    const diverse = ft.diverse.status !== null && ft.diverse.status < 400
        ? (ctx.wire.read.meta(ft.diverse.data).usage?.prompt ?? null)
        : null;
    return {
        state: "measured",
        delta,
        diverseDelta: diverse === null ? null : diverse - short,
        shortInputTokens: short,
        longInputTokens: long,
        servedModel: shortMeta.detectedModel,
        matchedTier: tierForDelta(delta, ctx.checks.tokenizerFingerprint?.signatures),
    };
}
export const tokenizerFingerprintRule = defineRule({
    id: "tokenizer-fingerprint",
    layer: "evidence",
    needs: ["fixedText"],
    check: "tokenizerFingerprint",
    // Every maker measures (the deltas are the record); only Claude's tiers
    // are judged, and only over a wire that carries usage as is.
    applies: (ctx) => ctx.wire.id !== "gemini",
    judge: async (ctx) => {
        if (ctx.maker.id !== "anthropic" || !ctx.maker.tiers)
            return null;
        const r = await fingerprintResult(ctx);
        const tier = judgeTokenizerFingerprint(ctx.model, r, ctx.maker.tiers);
        return tier
            ? {
                severity: "fail",
                reason: `tokenizer-fingerprint: delta ${r.delta} is the ${tier} signature, requested ${ctx.model}`,
                data: r,
            }
            : null;
    },
    report: async (ctx) => ({
        tokenizerFingerprint: await fingerprintResult(ctx),
    }),
});
//# sourceMappingURL=tokenizer-fingerprint.js.map