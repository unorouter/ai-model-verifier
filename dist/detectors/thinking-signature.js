/**
 * Anthropic thinking-signature check.
 *
 * Claude attaches a server-generated `signature` to every thinking block. A
 * relay serving some other model cannot produce one, so this is the only
 * evidence here that does not rest on asking the model who it is: identity and
 * behaviour probes can be coached with a system prompt, a signature cannot.
 *
 * What it does NOT prove: which tier answered. Sonnet returns a perfectly valid
 * signature when sold as Opus, so a pass here still needs the tier checks.
 *
 * Ported from veridrop (AGPL-3.0), whose detector stops at "a signature-shaped
 * string is present".
 *
 * Their DESIGN.md also specifies a replay step (hand the thinking block back so
 * Anthropic re-validates the signature, rejecting a forgery with 400/422) which
 * they never implemented. We built and measured it: **it does not work through a
 * relay**. Tested against two live upstreams (a6 merchant 3542 and pol) by
 * replaying a genuine block and then the same block with 308 bytes of random
 * base64 in place of the signature. Both upstreams returned 200 for both. A
 * relay re-issues the turn to its own backend rather than passing our thinking
 * block through, so nothing ever validates it.
 *
 * `strict` therefore stays off by default and is documented as proving only
 * that the endpoint accepts the block, not that the signature is real. Do not
 * present it as cryptographic proof.
 */
/**
 * Multi-step GCD: hard enough that adaptive models decide to think, and
 * deliberately not the 1071/462 pair from Anthropic's own docs, which a relay
 * could special-case.
 */
const PROBE_PROMPT = "Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.";
const THINKING_BUDGET_TOKENS = 2000;
/**
 * Covers thinking + answer together. Too small and an adaptive model skips
 * thinking entirely to fit, which reads as a fake when it is our own fault.
 */
const MAX_TOKENS = 16000;
/** Real signatures run to hundreds of chars; this only rejects a stub. */
const SIGNATURE_MIN_LEN = 50;
/** Adaptive-thinking models take `effort` at the top level, not inside `thinking`. */
const ADAPTIVE_MODELS = ["claude-opus-4-7", "claude-opus-4-8"];
/** Extended-thinking models take a token budget instead. */
const EXTENDED_MODELS = [
    "claude-opus-4-6",
    "claude-opus-4-5",
    "claude-opus-4-1",
    "claude-sonnet-4-6",
    "claude-sonnet-4-5",
    "claude-haiku-4-5",
];
const normalize = (model) => model.toLowerCase().replace(/[._]/g, "-").split("/").pop() ?? "";
export function thinkingModeFor(model) {
    const m = normalize(model);
    if (ADAPTIVE_MODELS.some((p) => m.startsWith(p)))
        return { kind: "adaptive" };
    if (EXTENDED_MODELS.some((p) => m.startsWith(p)))
        return { kind: "extended" };
    return null;
}
function readThinking(data) {
    const content = data?.content;
    if (!Array.isArray(content))
        return { block: null, signature: "", chars: 0 };
    for (const raw of content) {
        if (!raw || typeof raw !== "object")
            continue;
        const b = raw;
        if (b.type !== "thinking" && b.type !== "redacted_thinking")
            continue;
        return {
            block: b,
            signature: typeof b.signature === "string" ? b.signature : "",
            chars: typeof b.thinking === "string" ? b.thinking.length : 0,
        };
    }
    return { block: null, signature: "", chars: 0 };
}
export async function checkThinkingSignature(opts) {
    const mode = thinkingModeFor(opts.model);
    const empty = { signatureLength: 0, signaturePrefix: null, thinkingChars: 0 };
    if (!mode)
        return { state: "skipped", ...empty, reason: "model-has-no-thinking-mode" };
    const url = `${opts.baseUrl.replace(/\/+$/, "")}/v1/messages`;
    const headers = {
        "Content-Type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
    };
    const messages = [{ role: "user", content: PROBE_PROMPT }];
    // Non-streaming on purpose: streaming an adaptive model silently drops the
    // thinking block, so a real Claude would look unsigned.
    const body = {
        model: opts.model,
        max_tokens: MAX_TOKENS,
        messages,
        thinking: mode.kind === "extended"
            ? { type: "enabled", budget_tokens: THINKING_BUDGET_TOKENS }
            : { type: "adaptive", display: "summarized" },
    };
    // Sibling of `thinking`, never nested inside it: nesting is a 400.
    if (mode.kind === "adaptive")
        body["output_config"] = { effort: "xhigh" };
    const res = await opts.transport({
        mode: "direct",
        url,
        headers,
        reqBody: body,
        timeoutMs: opts.timeoutMs,
    });
    if (res.status === null || res.status >= 400)
        return {
            state: "skipped",
            ...empty,
            reason: `probe-failed:${res.status ?? "network"}`,
        };
    const found = readThinking(res.data);
    if (!found.block)
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
    if (!opts.strict)
        return { state: "signed", ...base };
    const replayVerified = await verifySignature({
        transport: opts.transport,
        url,
        headers,
        model: opts.model,
        block: found.block,
        timeoutMs: opts.timeoutMs,
    });
    // A rejection is real evidence (the endpoint checked and refused); an
    // acceptance is not, so it never upgrades or downgrades the state on its own.
    return {
        state: replayVerified ? "signed" : "unsigned",
        ...base,
        replayVerified,
        ...(replayVerified ? {} : { reason: "signature-rejected-on-replay" }),
    };
}
/**
 * Hand the thinking block back to the endpoint. Against api.anthropic.com this
 * would re-validate the signature; against a relay it does not (measured: a
 * forged 308-byte signature returned 200 on both upstreams tested), so the
 * result is reported as `replayVerified` evidence rather than a verdict.
 */
async function verifySignature(opts) {
    const res = await opts.transport({
        mode: "direct",
        url: opts.url,
        headers: opts.headers,
        reqBody: {
            model: opts.model,
            max_tokens: 1,
            messages: [
                { role: "user", content: PROBE_PROMPT },
                { role: "assistant", content: [opts.block] },
            ],
        },
        timeoutMs: opts.timeoutMs,
    });
    // A network failure proves nothing, so treat only an explicit rejection as
    // a forged signature.
    if (res.status === null)
        return true;
    return res.status < 400;
}
//# sourceMappingURL=thinking-signature.js.map