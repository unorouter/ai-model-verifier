export function makeNonce(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function nonceTag(nonce: string): string {
  return `Begin your reply with the tag [${nonce}] then a space, then your answer.`;
}

export function echoesNonce(text: string, nonce: string): boolean {
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
 * A run of text that every vocabulary splits differently: the apple run is one
 * token per word on every BPE and only tells Claude generations apart, this
 * one mixes scripts, digits, code punctuation and emoji. Fixed like the pair
 * above: a recorded delta is only comparable on the same bytes.
 */
export const DIVERSE_PROMPT = `${SHORT_PROMPT}\n\nReference text: 深度学习模型在2026年9月的推理成本下降了37.5%。The quick brown fox jumps over the lazy dog; naïve café résumé. fn main() { let x: Vec<u32> = (0..42).map(|i| i * i).collect(); println!("{:?}", x); } SELECT COUNT(*) FROM logs WHERE created_at > 1758412800 AND model_name LIKE 'deepseek-%'; 🚀🧠🍎🌊 ΑΒΓΔ αβγδ Привет мир こんにちは世界 안녕하세요 مرحبا بالعالم 0x7f3a9c 3.14159265 1e-9 https://example.invalid/path?q=a%20b&x=1`;

/**
 * Multi-step GCD: hard enough that adaptive models decide to think, and
 * deliberately not the 1071/462 pair from Anthropic's own docs, which a relay
 * could special-case.
 */
export const SIGNATURE_PROMPT =
  "Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm.";

export const FLOOR_PROMPT = "Reply with only the word ok.";
