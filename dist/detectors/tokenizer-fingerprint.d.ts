/**
 * Tokenizer fingerprint: how many input tokens the endpoint bills for a fixed
 * run of text.
 *
 * Every other tier signal can be coached: a system prompt teaches the model to
 * say "Opus", a relay rewrites the `model` field. The token count for a fixed
 * text cannot be coached, because the model never sees the question. It is
 * decided by the tokenizer behind the endpoint, and Claude generations do not
 * share one: on 2026-09-12, across 68 marketplace lanes measured twice each,
 * every lane whose reply named claude-haiku-4-5 billed a delta of exactly 90
 * (18 of 18), while lanes serving opus-4-6 and fable clustered at 84 on the
 * same relay path. Two of the lanes at 90 echoed an opus name in the `model`
 * field and were haiku by every other measure.
 *
 * Two uses, in order of confidence:
 *
 *  1. Drift. The delta is deterministic per lane (identical on repeat), so a
 *     change between two measurements of the same lane means the backend
 *     changed, whatever the reply now calls itself. The caller keeps the prior.
 *  2. Signature. A delta known to belong to a cheaper tier than the one
 *     requested. The table is calibration, not law: relays that count tokens
 *     themselves produce their own values (211, 609 were both seen), so an
 *     unknown delta proves nothing and only a listed one is judged.
 */
import type { TransportFn } from "../transport";
/** Wire format the endpoint speaks; Claude is sold over both. */
export type CountWire = "anthropic" | "openai";
export type TierSignatures = Readonly<Record<string, readonly number[]>>;
/**
 * Deltas measured on lanes whose reply named the tier, 2026-09-12. Only haiku
 * is listed: its 18 samples agreed to the token, while opus and fable spread
 * across relay counting paths and would condemn honest lanes.
 */
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