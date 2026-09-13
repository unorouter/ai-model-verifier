/**
 * Tokenizer fingerprint: how many input tokens the endpoint bills for a fixed
 * run of text, measured as the difference between a long and a short prompt so
 * anything a relay injects cancels out.
 *
 * What it is good for: drift. The delta is deterministic per endpoint (68
 * marketplace lanes measured twice each agreed to the token on every repeat),
 * so a change between two measurements of the same lane means the backend
 * changed, whatever the reply now calls itself. Keep the prior per lane and
 * compare with `fingerprintDrifted`.
 *
 * What it is NOT good for: naming the tier from the number alone. Opus 4.6,
 * Sonnet 4.6 and Haiku 4.5 share one tokenizer, so they bill the same delta on
 * the same path, and relays count differently from each other (77, 90, 134,
 * 160, 211 and 609 were all seen for one text on lanes echoing one model name)
 * or invent usage outright (13 tokens for eighty words, negative deltas on
 * repeat). A signature table therefore ships EMPTY: only a caller who has
 * calibrated a table on a specific endpoint family, per model generation and
 * across several text lengths, should pass one, and even then only
 * between-model differences on the same endpoint are evidence.
 */
import type { TransportFn } from "../transport";
/** Wire format the endpoint speaks; Claude is sold over both. */
export type CountWire = "anthropic" | "openai";
export type TierSignatures = Readonly<Record<string, readonly number[]>>;
/** Empty on purpose; see the module note. Pass your own calibration. */
export declare const DEFAULT_TIER_SIGNATURES: TierSignatures;
export type TokenizerFingerprintState = "measured" | "unmeasured";
export type TokenizerFingerprintResult = {
    state: TokenizerFingerprintState;
    /** long minus short input tokens; the fingerprint itself. */
    delta: number | null;
    shortInputTokens: number | null;
    longInputTokens: number | null;
    /** `model` echoed on the short reply, when the endpoint reported one. */
    servedModel: string | null;
    /** Tier whose signature the delta matched, when any did. */
    matchedTier: string | null;
    reason?: string;
};
export declare function tierForDelta(delta: number, signatures?: TierSignatures): string | null;
/**
 * The served tier when the fingerprint names one cheaper than requested, or
 * null. `tiers` is the provider's tier vocabulary (opus, sonnet, haiku, fable).
 */
export declare function judgeTokenizerFingerprint(requestedModel: string, result: TokenizerFingerprintResult, tiers: readonly string[]): string | null;
/** True when two measurements of the same lane disagree: the backend changed. */
export declare function fingerprintDrifted(prior: number | null | undefined, current: TokenizerFingerprintResult): boolean;
export declare function measureTokenizerFingerprint(opts: {
    transport: TransportFn;
    baseUrl: string;
    apiKey: string;
    model: string;
    wire: CountWire;
    timeoutMs: number;
    signatures?: TierSignatures;
}): Promise<TokenizerFingerprintResult>;
//# sourceMappingURL=tokenizer-fingerprint.d.ts.map