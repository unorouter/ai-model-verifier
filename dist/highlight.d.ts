export type HighlightKind = "foreign" | "cjk" | "coding-tool" | "scam" | "home" | null;
export type HighlightSegment = {
    text: string;
    kind: HighlightKind;
};
/** Marks the phrases the signals react to, for a UI to colour a reply. */
export declare function highlightSpans(text: string, vendorId: string, probeLabel: string): HighlightSegment[];
//# sourceMappingURL=highlight.d.ts.map