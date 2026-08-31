import type { VerifyProvider } from "./types";
export type HighlightKind = "foreign" | "cjk" | "coding-tool" | "scam" | "home" | null;
export type HighlightSegment = {
    text: string;
    kind: HighlightKind;
};
export declare function highlightSpans(text: string, providerKind: VerifyProvider, probeLabel: string): HighlightSegment[];
//# sourceMappingURL=highlight.d.ts.map