/**
 * Token-accounting checks for Anthropic endpoints.
 *
 * The signature check answers "is this really Claude". These answer a different
 * question the signature cannot: "are the numbers you are billing me true".
 * A relay can forward genuine Claude and still inflate `input_tokens` on every
 * call, and nothing in an identity probe would notice.
 *
 * Ported from veridrop (AGPL-3.0) `token_usage.py` / `integrity.py`, whose
 * tolerances were calibrated against the official API. Do not tighten them
 * without re-measuring: the loose-looking bounds exist because real Anthropic
 * responses sat near them.
 */
import { COUNT_PROBE_MAX_TOKENS as MAX_TOKENS, LONG_PROMPT, SHORT_PROMPT, } from "../internal/fixed-text";
/**
 * Expected `input_tokens` growth between the short and long prompt.
 *
 * Two bands because Anthropic changed tokenizer: opus-4-7/4-8 encode that same
 * text into materially more tokens. A relay claiming a new-tokenizer model
 * while serving an older one lands in the wrong band, which makes this a tier
 * check as well as a billing check.
 */
const DELTA_OLD = { min: 45, max: 140 };
const DELTA_NEW = { min: 90, max: 230 };
const NEW_TOKENIZER_MODELS = ["claude-opus-4-7", "claude-opus-4-8"];
/** `count_tokens` should agree with the billed `input_tokens` this closely. */
const countTolerance = (n) => Math.max(4, Math.round(n * 0.2));
const normalize = (model) => model.toLowerCase().replace(/[._]/g, "-").split("/").pop() ?? "";
export function expectedInputDelta(model) {
    const m = normalize(model);
    return NEW_TOKENIZER_MODELS.some((p) => m.startsWith(p))
        ? DELTA_NEW
        : DELTA_OLD;
}
/** Rejects booleans, which are `typeof "number"`-adjacent traps in JS. */
function intOf(v) {
    return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;
}
function usageOf(data) {
    const u = data?.usage;
    return { input: intOf(u?.input_tokens), output: intOf(u?.output_tokens) };
}
export async function checkTokenTruth(opts) {
    const base = opts.baseUrl.replace(/\/+$/, "");
    const headers = {
        "Content-Type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
    };
    const ask = (prompt) => opts.transport({
        mode: "direct",
        url: `${base}/v1/messages`,
        headers,
        reqBody: {
            model: opts.model,
            max_tokens: MAX_TOKENS,
            messages: [{ role: "user", content: prompt }],
        },
        timeoutMs: opts.timeoutMs,
    });
    const [shortRes, longRes] = await Promise.all([
        ask(SHORT_PROMPT),
        ask(LONG_PROMPT),
    ]);
    const noCounts = {
        shortInputTokens: null,
        longInputTokens: null,
        countTokens: null,
    };
    if (shortRes.status === null || shortRes.status >= 400)
        return {
            ok: null,
            checks: [],
            ...noCounts,
            reason: `probe-failed:${shortRes.status ?? "network"}`,
        };
    const s = usageOf(shortRes.data);
    const l = usageOf(longRes.data);
    const checks = [];
    const usagePresent = s.input !== null && l.input !== null;
    checks.push({
        id: "usage-present",
        pass: usagePresent,
        detail: usagePresent
            ? `short=${s.input}, long=${l.input}`
            : "endpoint reported no usage counts",
    });
    // Without usage there is nothing to verify; a missing field is not fraud.
    if (!usagePresent)
        return { ok: null, checks, ...noCounts, reason: "no-usage-reported" };
    const band = expectedInputDelta(opts.model);
    const delta = l.input - s.input;
    const deltaOk = delta >= band.min && delta <= band.max;
    checks.push({
        id: "input-delta",
        pass: deltaOk,
        detail: `delta=${delta}, expected ${band.min}-${band.max}`,
    });
    // Output above the cap we set means the count is invented, not merely padded.
    const outputs = [s.output, l.output].filter((v) => v !== null);
    const outputOk = outputs.every((v) => v > 0 && v <= MAX_TOKENS + 4);
    checks.push({
        id: "output-bounded",
        pass: outputOk,
        detail: `outputs=${outputs.join(",") || "none"} (cap ${MAX_TOKENS})`,
    });
    // The same upstream pricing the same request without generating: the
    // strongest anti-inflation signal available, when the endpoint exposes it.
    let counted = null;
    const countRes = await opts.transport({
        mode: "direct",
        url: `${base}/v1/messages/count_tokens`,
        headers,
        reqBody: {
            model: opts.model,
            messages: [{ role: "user", content: SHORT_PROMPT }],
        },
        timeoutMs: opts.timeoutMs,
    });
    if (countRes.status !== null && countRes.status < 400) {
        counted = intOf(countRes.data?.input_tokens);
        if (counted !== null) {
            const drift = Math.abs(counted - s.input);
            const tol = countTolerance(s.input);
            checks.push({
                id: "count-tokens",
                pass: drift <= tol,
                detail: `count=${counted} vs billed=${s.input}, drift=${drift} (tolerance ${tol})`,
            });
        }
    }
    // A missing count_tokens endpoint is common on relays and proves nothing, so
    // it is simply absent from the checks rather than counted as a failure.
    return {
        ok: checks.every((c) => c.pass),
        checks,
        shortInputTokens: s.input,
        longInputTokens: l.input,
        countTokens: counted,
    };
}
//# sourceMappingURL=token-truth.js.map