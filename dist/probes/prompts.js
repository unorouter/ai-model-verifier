export function makeNonce() {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export function nonceTag(nonce) {
    return `Begin your reply with the tag [${nonce}] then a space, then your answer.`;
}
export function echoesNonce(text, nonce) {
    return text.includes(nonce.toLowerCase());
}
/**
 * The fixed prompt pair every token-count rule measures against. The short
 * prompt anchors the count; the long one appends a known run of text, so the
 * difference is the endpoint's tokenizer at work on that run alone. Anything a
 * relay injects (a system prompt, a wrapper) is present in both and cancels.
 *
 * Do not change the text: every recorded delta was measured on exactly this
 * pair, and a different run of text yields a different table of signatures.
 */
export const SHORT_PROMPT = "Reply with exactly: ok";
export const LONG_PROMPT = `${SHORT_PROMPT}\n\nReference text:${" apple".repeat(80)}`;
export const COUNT_PROBE_MAX_TOKENS = 16;
/**
 * Multi-step GCD: hard enough that adaptive models decide to think, and
 * deliberately not the 1071/462 pair from Anthropic's own docs, which a relay
 * could special-case.
 */
export const SIGNATURE_PROMPT = "Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.";
export const FLOOR_PROMPT = "Reply with only the word ok.";
//# sourceMappingURL=prompts.js.map