export declare function makeNonce(): string;
export declare function nonceTag(nonce: string): string;
export declare function echoesNonce(text: string, nonce: string): boolean;
/**
 * The fixed prompt pair every token-count rule measures against. The short
 * prompt anchors the count; the long one appends a known run of text, so the
 * difference is the endpoint's tokenizer at work on that run alone. Anything a
 * relay injects (a system prompt, a wrapper) is present in both and cancels.
 *
 * Do not change the text: every recorded delta was measured on exactly this
 * pair, and a different run of text yields a different table of signatures.
 */
export declare const SHORT_PROMPT = "Reply with exactly: ok";
export declare const LONG_PROMPT: string;
export declare const COUNT_PROBE_MAX_TOKENS = 16;
/**
 * Multi-step GCD: hard enough that adaptive models decide to think, and
 * deliberately not the 1071/462 pair from Anthropic's own docs, which a relay
 * could special-case.
 */
export declare const SIGNATURE_PROMPT = "Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.";
export declare const FLOOR_PROMPT = "Reply with only the word ok.";
//# sourceMappingURL=prompts.d.ts.map