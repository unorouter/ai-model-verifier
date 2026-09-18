import { isTransientError } from "../identity/signals";
import { vendorFor } from "../vendors/table";
import { callWire, wireCtx } from "./context";
const HANDSHAKE_PROMPT = "hi";
const HANDSHAKE_MAX_TOKENS = 1;
function classifyStatus(status) {
    if (status >= 200 && status < 300)
        return "ok";
    if (status === 401 || status === 403)
        return "auth";
    if (isTransientError(`HTTP ${status}`))
        return "transient";
    if (status >= 400 && status < 500)
        return "format";
    return "transient";
}
// An error body naming the model (OpenAI's `model_not_found`, and the same
// shape from every gateway that copies it) means the endpoint understood the
// request and rejected the MODEL. Reporting that as a format failure sends
// people looking for a protocol bug when they only mistyped a model name.
const MODEL_ERROR_CODES = [
    "model_not_found",
    "model_not_supported",
    "invalid_model",
    "unknown_model",
];
function rejectsModel(data) {
    const err = data?.error;
    if (typeof err !== "object" || err === null)
        return false;
    const fields = err;
    const code = typeof fields.code === "string" ? fields.code.toLowerCase() : "";
    const type = typeof fields.type === "string" ? fields.type.toLowerCase() : "";
    if (MODEL_ERROR_CODES.includes(code) || MODEL_ERROR_CODES.includes(type))
        return true;
    const msg = typeof fields.message === "string" ? fields.message.toLowerCase() : "";
    return (msg.includes("model") &&
        (msg.includes("not found") ||
            msg.includes("not offered") ||
            msg.includes("not supported") ||
            msg.includes("does not exist")));
}
async function tryWire(ctx, wire) {
    const built = wire.ops.chat({
        model: ctx.model,
        maxTokens: HANDSHAKE_MAX_TOKENS,
        messages: [{ role: "user", content: HANDSHAKE_PROMPT }],
    }, wireCtx(ctx));
    const res = await callWire(ctx, built);
    if (res.corsBlocked)
        return { outcome: "cors", status: null, corsBlocked: true };
    if (res.status === null)
        return { outcome: "transient", status: null, corsBlocked: false };
    const outcome = classifyStatus(res.status);
    return {
        outcome: outcome !== "ok" && rejectsModel(res.data) ? "model" : outcome,
        status: res.status,
        corsBlocked: false,
    };
}
/** The requested wire first, then its declared fallbacks, until one answers. */
export async function runHandshake(ctx, vendors) {
    const order = [
        ctx.wire,
        ...ctx.wire.fallbackWires.flatMap((id) => {
            const w = vendorFor(vendors, id);
            return w ? [w] : [];
        }),
    ];
    let sawAuth = false;
    let sawModelRejected = false;
    let sawTransient = false;
    let lastStatus = null;
    for (const wire of order) {
        const r = await tryWire(ctx, wire);
        lastStatus = r.status;
        if (r.outcome === "cors")
            return {
                ok: false,
                reason: "cors-needs-backend",
                status: null,
                corsBlocked: true,
            };
        if (r.outcome === "ok")
            return { ok: true, wire, status: r.status };
        if (r.outcome === "auth")
            sawAuth = true;
        if (r.outcome === "model")
            sawModelRejected = true;
        if (r.outcome === "transient")
            sawTransient = true;
    }
    const fail = (reason) => ({
        ok: false,
        reason,
        status: lastStatus,
        corsBlocked: false,
    });
    // Before the key check: a gateway that rejects the model name often answers
    // 403 on the second wire too, which would otherwise read as a bad key.
    if (sawModelRejected)
        return fail("model-rejected");
    if (sawAuth)
        return fail("invalid-key");
    if (lastStatus === null)
        return fail("unreachable");
    // Every wire answered 429/5xx: the endpoint is having a bad moment, which is
    // never evidence that it speaks no supported format.
    if (sawTransient)
        return fail("endpoint-busy");
    return fail("no-format");
}
//# sourceMappingURL=handshake.js.map