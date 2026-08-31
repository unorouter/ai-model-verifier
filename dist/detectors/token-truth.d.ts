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
import type { TransportFn } from "../transport";
export type TokenTruthCheck = {
    id: "usage-present" | "input-delta" | "output-bounded" | "count-tokens";
    pass: boolean;
    detail: string;
};
export type TokenTruthResult = {
    /** null when nothing could be measured (endpoint refused every probe). */
    ok: boolean | null;
    checks: TokenTruthCheck[];
    shortInputTokens: number | null;
    longInputTokens: number | null;
    countTokens: number | null;
    reason?: string;
};
export declare function expectedInputDelta(model: string): {
    min: number;
    max: number;
};
export declare function checkTokenTruth(opts: {
    transport: TransportFn;
    baseUrl: string;
    apiKey: string;
    model: string;
    timeoutMs: number;
}): Promise<TokenTruthResult>;
//# sourceMappingURL=token-truth.d.ts.map