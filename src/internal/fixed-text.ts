/**
 * The fixed prompt pair every token-count detector measures against. The short
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
