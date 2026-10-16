/**
 * Tokenizer family: which vocabulary billed the four script runs.
 *
 * A system prompt can make any model call itself Claude, but it cannot change
 * how the backend splits text. Radox sold "claude-fable-5.1" that passed the
 * identity probes on most keys under a hidden persona prompt, yet billed
 * 101/80/101/120, the Llama 4 vocabulary Meta's Muse Spark uses, where every
 * Claude path measured bills 135 or more on the Chinese run.
 *
 * Fails only when all of these hold, so a quirky relay cannot trip it:
 * the claimed maker has known vectors, the measured vector matches none of
 * them, it does match another family, and that family is not one relays
 * estimate usage with (OpenAI's).
 */
import { type ScriptVector } from "../models/tokenizers";
export type TokenizerFamilyState = "own"
/** Matches another maker's family and none of the claimed maker's. */
 | "foreign"
/** Matches only an estimator family: the relay may be counting. */
 | "estimated"
/** Measured but matches no known family. */
 | "unknown" | "unmeasured";
export type TokenizerFamilyResult = {
    state: TokenizerFamilyState;
    vector: ScriptVector | null;
    families: string[];
    makers: string[];
    reason?: string;
};
/** Judge one measured vector against the claimed maker. Pure. */
export declare function judgeTokenizerFamily(maker: string, vector: ScriptVector): TokenizerFamilyResult;
export declare const tokenizerFamilyRule: import("./types").Rule<"tokenizer-family", "scriptTokens", "evidence">;
//# sourceMappingURL=tokenizer-family.d.ts.map