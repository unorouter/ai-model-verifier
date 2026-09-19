/**
 * Survey questions: asked alongside the ladder, never graded into a verdict.
 * Each answer is recorded as it came (text, usage, hidden tokens, latency) so
 * weeks of runs can be read back per model and per lane: what a lane says its
 * cutoff is, whether a relay injects a system prompt, whether a "pro" label
 * thinks before a sum. `correct` is a plain fact check where one exists.
 */
export type SurveyDef<L extends string = string> = {
    label: L;
    maxTokens: number;
    prompt(nonce: string): string;
    /** A fact check on the answer; undefined when the question has no single right answer. */
    correct?(answer: string): boolean;
};
export declare const SURVEY: readonly [{
    readonly label: "cutoff";
    readonly maxTokens: 40;
    readonly prompt: (n: string) => string;
}, {
    readonly label: "context-window";
    readonly maxTokens: 40;
    readonly prompt: (n: string) => string;
}, {
    readonly label: "system-prompt";
    readonly maxTokens: 400;
    readonly prompt: (n: string) => string;
}, {
    readonly label: "arithmetic";
    readonly maxTokens: 40;
    readonly prompt: (n: string) => string;
    readonly correct: (answer: string) => boolean;
}, {
    readonly label: "json";
    readonly maxTokens: 80;
    readonly prompt: (n: string) => string;
    readonly correct: (answer: string) => boolean;
}, {
    readonly label: "self";
    readonly maxTokens: 120;
    readonly prompt: (n: string) => string;
}];
export type SurveyLabel = (typeof SURVEY)[number]["label"];
/** The answer without the nonce tag the prompt asked for. */
export declare function stripNonce(text: string, nonce: string): string;
//# sourceMappingURL=survey.d.ts.map