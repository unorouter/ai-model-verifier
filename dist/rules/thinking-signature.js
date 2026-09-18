/**
 * Anthropic thinking signature.
 *
 * Claude attaches a server-generated `signature` to every thinking block. A
 * relay serving some other model cannot produce one, so this is the only
 * evidence here that does not rest on asking the model who it is: identity and
 * behaviour probes can be coached with a system prompt, a signature cannot.
 *
 * What it does NOT prove: which tier answered. Sonnet returns a perfectly valid
 * signature when sold as Opus, so a pass here still needs the tier checks.
 *
 * The `strict` replay (hand the block back so the vendor re-validates it) was
 * built and measured: it does not work through a relay. A genuine block and the
 * same block with 308 bytes of random base64 in place of the signature both
 * came back 200 from two live upstreams, because a relay re-issues the turn to
 * its own backend rather than passing our block through. It stays off by
 * default and only tells you the endpoint accepts a thinking block.
 */
import { defineRule } from "./types";
/** Real signatures run to hundreds of chars; this only rejects a stub. */
const SIGNATURE_MIN_LEN = 50;
async function signatureResult(ctx) {
    const empty = { signatureLength: 0, signaturePrefix: null, thinkingChars: 0 };
    const reply = await ctx.evidence("thinkingReply");
    if (!reply)
        return { state: "skipped", ...empty, reason: "model-has-no-thinking-mode" };
    const res = reply.res;
    if (res.status === null || res.status >= 400)
        return {
            state: "skipped",
            ...empty,
            reason: `probe-failed:${res.status ?? "network"}`,
        };
    const found = ctx.wire.read.thinkingBlock?.(res.data) ?? null;
    if (!found)
        return { state: "no-thinking", ...empty, reason: "no-thinking-block" };
    const sig = found.signature;
    const base = {
        signatureLength: sig.length,
        signaturePrefix: sig ? sig.slice(0, 32) : null,
        thinkingChars: found.chars,
    };
    if (!sig)
        return { state: "unsigned", ...base, reason: "no-signature-field" };
    if (sig.length < SIGNATURE_MIN_LEN)
        return { state: "unsigned", ...base, reason: "signature-too-short" };
    if (reply.replayAccepted === undefined)
        return { state: "signed", ...base };
    // A rejection is real evidence (the endpoint checked and refused); an
    // acceptance is not, so it never upgrades the state on its own.
    return {
        state: reply.replayAccepted ? "signed" : "unsigned",
        ...base,
        replayVerified: reply.replayAccepted,
        ...(reply.replayAccepted ? {} : { reason: "signature-rejected-on-replay" }),
    };
}
export const signatureRule = defineRule({
    id: "signature",
    layer: "note",
    needs: ["thinkingReply"],
    check: "signature",
    applies: (ctx) => ctx.wire.read.thinkingBlock !== undefined,
    judge: async (ctx) => {
        const r = await signatureResult(ctx);
        return r.state === "no-thinking"
            ? { severity: "note", reason: `signature: ${r.reason}` }
            : null;
    },
    report: async (ctx) => ({ signature: await signatureResult(ctx) }),
});
//# sourceMappingURL=thinking-signature.js.map