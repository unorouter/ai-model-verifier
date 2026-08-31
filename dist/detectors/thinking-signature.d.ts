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
import type { TransportFn } from "../transport";
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
export declare function thinkingModeFor(model: string): {
    kind: "adaptive" | "extended";
} | null;
export declare function checkThinkingSignature(opts: {
    transport: TransportFn;
    baseUrl: string;
    apiKey: string;
    model: string;
    timeoutMs: number;
    /**
     * Replay the thinking block to the same endpoint. Measured as NOT proving
     * authenticity through a relay (see the module docstring): both a genuine and
     * a forged signature come back 200, because the relay re-issues the turn
     * upstream instead of forwarding our block. Off by default; it only tells you
     * the endpoint accepts a thinking block in the request.
     */
    strict?: boolean;
}): Promise<SignatureResult>;
//# sourceMappingURL=thinking-signature.d.ts.map