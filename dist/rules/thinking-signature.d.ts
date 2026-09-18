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
export type SignatureState = 
/** Signed thinking block: a genuine Anthropic path answered. */
"signed"
/**
 * Thought, but no signature. Expected when the lane crosses an
 * OpenAI-shaped hop, which has no field to carry one, so this is
 * unprovable rather than fake. Never a hard fail on its own.
 */
 | "unsigned"
/** Thinking was requested and no block came back at all. */
 | "no-thinking"
/** Model or endpoint cannot be asked; carries no evidence either way. */
 | "skipped";
export type SignatureResult = {
    state: SignatureState;
    signatureLength: number;
    /** First 32 chars, for the report; never the whole signature. */
    signaturePrefix: string | null;
    thinkingChars: number;
    /** Only set when the replay check actually ran. */
    replayVerified?: boolean;
    reason?: string;
};
export declare const signatureRule: import("./types").Rule<"signature", "thinkingReply", "note">;
//# sourceMappingURL=thinking-signature.d.ts.map