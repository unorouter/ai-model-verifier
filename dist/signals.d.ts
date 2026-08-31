import type { ProbeLabel, ProbeSignal } from "./types";
export declare const includesAny: (text: string, patterns: string[]) => boolean;
export declare const hasCodingToolRefusal: (text: string) => boolean;
export declare const hasScamPage: (text: string) => boolean;
export declare function cjkLeak(text: string): boolean;
export declare function hasForeignIdentity(text: string, foreignPatterns: string[], cloudModelNamePatterns: string[], probe: ProbeLabel): boolean;
export declare function tierOf(text: string, tiers: readonly string[]): string | null;
export declare function detectTierMismatch(requestedModel: string, modelNameText: string | undefined, tiers: readonly string[]): string | null;
export declare function detectSignal(text: string, probeLabel: ProbeLabel, foreignPatterns: string[], cloudModelNamePatterns: string[], acceptsCloudHostIdentity: boolean): ProbeSignal;
export declare function isTransientError(msg: string): boolean;
//# sourceMappingURL=signals.d.ts.map