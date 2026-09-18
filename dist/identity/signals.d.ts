import type { ProbeLabel, ProbeSignal } from "../probes/table";
import type { VendorIdentity } from "../vendors/types";
export declare const includesAny: (text: string, patterns: readonly string[]) => boolean;
export declare const hasCodingToolRefusal: (text: string) => boolean;
export declare const hasScamPage: (text: string) => boolean;
/**
 * English prompts expect English answers; a substituted or distilled Chinese
 * model (or a corrupting proxy) leaks CJK into the reply even when it has
 * learned to say "anthropic".
 */
export declare function cjkLeak(text: string): boolean;
export declare function hasForeignIdentity(text: string, identity: VendorIdentity, probe: ProbeLabel): boolean;
export declare function detectSignal(text: string, probe: ProbeLabel, identity: VendorIdentity): ProbeSignal;
export declare function isTransientError(msg: string): boolean;
//# sourceMappingURL=signals.d.ts.map