import type { ResolvedMaker } from "../makers/types";
import type { ProbeLabel, ProbeSignal } from "../probes/table";
export declare const includesAny: (text: string, patterns: readonly string[]) => boolean;
/**
 * Maker vocabulary is short ("meta", "o3", "glm"), so it is matched on word
 * boundaries: no letter or digit before, no letter after. A digit or hyphen
 * may follow ("qwen3", "gpt-5", "o3-mini"); "metadata" and "zaid" never hit.
 */
export declare const hasWord: (text: string, word: string) => boolean;
export declare const includesAnyWord: (text: string, words: readonly string[]) => boolean;
export declare const hasCodingToolRefusal: (text: string) => boolean;
export declare const hasScamPage: (text: string) => boolean;
/**
 * English prompts expect English answers; a substituted or distilled Chinese
 * model (or a corrupting proxy) leaks CJK into the reply even when it has
 * learned to say "anthropic". Not a tell for a maker that trains on Chinese.
 */
export declare function cjkLeak(text: string, maker?: ResolvedMaker): boolean;
export declare function hasForeignIdentity(text: string, maker: ResolvedMaker, probe: ProbeLabel): boolean;
export declare function detectSignal(text: string, probe: ProbeLabel, maker: ResolvedMaker): ProbeSignal;
export declare function isTransientError(msg: string): boolean;
//# sourceMappingURL=signals.d.ts.map