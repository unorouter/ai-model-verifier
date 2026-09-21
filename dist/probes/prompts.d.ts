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
 * A run of text that every vocabulary splits differently: the apple run is one
 * token per word on every BPE and only tells Claude generations apart, this
 * one mixes scripts, digits, code punctuation and emoji. Fixed like the pair
 * above: a recorded delta is only comparable on the same bytes.
 */
export declare const DIVERSE_PROMPT = "Reply with exactly: ok\n\nReference text: \u6DF1\u5EA6\u5B66\u4E60\u6A21\u578B\u57282026\u5E749\u6708\u7684\u63A8\u7406\u6210\u672C\u4E0B\u964D\u4E8637.5%\u3002The quick brown fox jumps over the lazy dog; na\u00EFve caf\u00E9 r\u00E9sum\u00E9. fn main() { let x: Vec<u32> = (0..42).map(|i| i * i).collect(); println!(\"{:?}\", x); } SELECT COUNT(*) FROM logs WHERE created_at > 1758412800 AND model_name LIKE 'deepseek-%'; \uD83D\uDE80\uD83E\uDDE0\uD83C\uDF4E\uD83C\uDF0A \u0391\u0392\u0393\u0394 \u03B1\u03B2\u03B3\u03B4 \u041F\u0440\u0438\u0432\u0435\u0442 \u043C\u0438\u0440 \u3053\u3093\u306B\u3061\u306F\u4E16\u754C \uC548\uB155\uD558\uC138\uC694 \u0645\u0631\u062D\u0628\u0627 \u0628\u0627\u0644\u0639\u0627\u0644\u0645 0x7f3a9c 3.14159265 1e-9 https://example.invalid/path?q=a%20b&x=1";
/**
 * Multi-step GCD: hard enough that adaptive models decide to think, and
 * deliberately not the 1071/462 pair from Anthropic's own docs, which a relay
 * could special-case.
 */
export declare const SIGNATURE_PROMPT = "Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.";
export declare const FLOOR_PROMPT = "Reply with only the word ok.";
//# sourceMappingURL=prompts.d.ts.map