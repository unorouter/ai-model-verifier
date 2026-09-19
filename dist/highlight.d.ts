export type HighlightKind = "foreign" | "cjk" | "coding-tool" | "scam" | "home" | null;
export type HighlightSegment = {
    text: string;
    kind: HighlightKind;
};
/**
 * Marks the phrases the signals react to, for a UI to colour a reply. `makerId`
 * is the result's maker; a wire id is accepted and stands for its default maker.
 */
export declare function highlightSpans(text: string, makerId: string, probeLabel: string): HighlightSegment[];
//# sourceMappingURL=highlight.d.ts.map