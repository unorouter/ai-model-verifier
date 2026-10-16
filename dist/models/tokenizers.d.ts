/**
 * Tokenizer families by the input-token deltas they bill for the four
 * SCRIPT_VARIANTS runs (digits, cjk, spaces, code), in that order.
 *
 * Open families were computed from each maker's published tokenizer and agree
 * with the counts their own lanes bill (glm-5.3 and gpt-5.5 to the token).
 * Closed families were measured on lanes that pass every other rule: Gemini on
 * three relays, Claude on five relay paths, which bill five different vectors
 * between them and so get one entry each.
 *
 * Families share a vector where the tokenizers agree on these runs: Llama 4,
 * Muse Spark and Grok 4.3 all bill 101/80/101/120, and DeepSeek, Step and Kimi
 * all bill 101/61/101/120, so those entries name every maker and only rule out
 * the others.
 */
import type { MakerId } from "../makers/table";
import { type ScriptVariant } from "../probes/prompts";
export type ScriptVector = Readonly<Record<ScriptVariant, number>>;
export type TokenizerFamily = {
    id: string;
    makers: readonly MakerId[];
    vector: ScriptVector;
    /**
     * Relays estimate usage with OpenAI's tokenizers when the upstream reports
     * none, so a match here may be the relay counting, not the model.
     */
    estimator?: boolean;
};
export declare const TOKENIZER_FAMILIES: readonly TokenizerFamily[];
/** One token either way: Vertex bills Gemini one less on every run. */
export declare const SCRIPT_TOLERANCE = 1;
export declare function matchTokenizerFamilies(measured: ScriptVector, families?: readonly TokenizerFamily[]): TokenizerFamily[];
export declare const knowsMaker: (maker: string, families?: readonly TokenizerFamily[]) => boolean;
//# sourceMappingURL=tokenizers.d.ts.map