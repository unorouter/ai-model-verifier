import { isRecord } from "../internal/utils";
export const DEFAULT_FINGERPRINT_REPEATS = 3;
export const DEFAULT_FINGERPRINT_CONCURRENCY = 4;
export function resolveChecks(checks) {
    const c = checks ?? {};
    return {
        signature: c.signature
            ? {
                strict: typeof c.signature === "object" && c.signature.strict === true,
            }
            : null,
        tokenTruth: c.tokenTruth === true,
        thinkingFloor: c.thinkingFloor
            ? {
                minCompletionTokens: typeof c.thinkingFloor === "object"
                    ? (c.thinkingFloor.minCompletionTokens ?? null)
                    : null,
            }
            : null,
        tokenizerFingerprint: c.tokenizerFingerprint
            ? {
                signatures: typeof c.tokenizerFingerprint === "object"
                    ? c.tokenizerFingerprint.signatures
                    : undefined,
            }
            : null,
        survey: c.survey === true,
        answerFingerprint: c.answerFingerprint
            ? {
                repeats: typeof c.answerFingerprint === "object"
                    ? (c.answerFingerprint.repeats ?? DEFAULT_FINGERPRINT_REPEATS)
                    : DEFAULT_FINGERPRINT_REPEATS,
                concurrency: typeof c.answerFingerprint === "object"
                    ? (c.answerFingerprint.concurrency ??
                        DEFAULT_FINGERPRINT_CONCURRENCY)
                    : DEFAULT_FINGERPRINT_CONCURRENCY,
            }
            : null,
    };
}
export const wireCtx = (ctx) => ({
    baseUrl: ctx.baseUrl,
    apiKey: ctx.apiKey,
    direct: ctx.direct,
    facts: ctx.facts,
});
/** Multipart and binary bodies pass through untouched. */
export function mergeBodyExtras(body, extras) {
    if (!extras || !isRecord(body))
        return body;
    return { ...body, ...extras };
}
export function callWire(ctx, built) {
    return ctx.transport({
        mode: ctx.mode,
        url: built.url,
        headers: built.headers,
        reqBody: mergeBodyExtras(built.body, ctx.bodyExtras),
        timeoutMs: ctx.timeoutMs,
    });
}
export const buildChat = (ctx, req) => ctx.wire.ops.chat({ model: ctx.model, ...req }, wireCtx(ctx));
export const chat = (ctx, req) => callWire(ctx, buildChat(ctx, req));
//# sourceMappingURL=context.js.map