import type { VendorAdapter } from "../vendors/types";
/**
 * A probe is a request plus a grader for its own reply. Probes are data, not
 * rules: the ladder rules read across every probe's outcome (a quorum, a mux
 * count), so a probe judging itself would be the wrong unit.
 */
export type ProbeDef<L extends string = string> = {
    label: L;
    maxTokens: number;
    prompt(nonce: string): string;
    grade(text: string, wire: VendorAdapter): boolean;
};
export declare const PROBES: readonly [{
    readonly label: "emotional";
    readonly maxTokens: 200;
    readonly prompt: (n: string) => string;
    readonly grade: (text: string) => boolean;
}, {
    readonly label: "creative";
    readonly maxTokens: 120;
    readonly prompt: (n: string) => string;
    readonly grade: (text: string) => boolean;
}, {
    readonly label: "identity";
    readonly maxTokens: 60;
    readonly prompt: (n: string) => string;
    readonly grade: (text: string, wire: VendorAdapter) => boolean;
}, {
    readonly label: "model-name";
    readonly maxTokens: 80;
    readonly prompt: (n: string) => string;
    readonly grade: (text: string, wire: VendorAdapter) => boolean;
}];
export type ProbeLabel = (typeof PROBES)[number]["label"];
export declare const PROBE_SIGNALS: readonly ["coding-tool", "scam", "foreign", "cloud-host", "cjk-leak", "blank"];
export type ProbeSignal = (typeof PROBE_SIGNALS)[number] | null;
//# sourceMappingURL=table.d.ts.map