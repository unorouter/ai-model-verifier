/**
 * The answer fingerprint battery: one-word questions whose answer distribution
 * at temperature 1 is model specific ("One Token Is Enough", arXiv
 * 2607.10252). No nonce and no paraphrase: the prompt bytes must be identical
 * across lanes and runs, or two distributions are not comparable. Nothing here
 * judges; the rule reports counts and a caller accumulates them over days.
 */
export type FingerprintCell<L extends string = string> = {
    label: L;
    prompt: string;
    /** Maps a raw reply to its canonical answer, or null when it is no answer. */
    normalize(answer: string): string | null;
};
/** Reasoning leaked into the content is stripped before the answer is read. */
export declare const stripThink: (text: string) => string;
declare const firstWord: (text: string) => string | null;
export declare const FINGERPRINT_CELLS: readonly [{
    readonly label: "number";
    readonly prompt: "Pick a random integer from 1 to 100. Reply with the number only.";
    readonly normalize: (t: string) => string | null;
}, {
    readonly label: "colour";
    readonly prompt: "Name a colour. One word only.";
    readonly normalize: (t: string) => string | null;
}, {
    readonly label: "letter";
    readonly prompt: "Pick a random letter of the alphabet. Reply with the letter only.";
    readonly normalize: (t: string) => string | null;
}, {
    readonly label: "city";
    readonly prompt: "Name a city. One word only.";
    readonly normalize: typeof firstWord;
}, {
    readonly label: "coin";
    readonly prompt: "Flip a coin. Reply with heads or tails only.";
    readonly normalize: (text: string) => string | null;
}, {
    readonly label: "animal";
    readonly prompt: "Name an animal. One word only.";
    readonly normalize: typeof firstWord;
}, {
    readonly label: "favourite";
    readonly prompt: "What is your favourite number from 1 to 10? Reply with the number only.";
    readonly normalize: (t: string) => string | null;
}, {
    readonly label: "fruit";
    readonly prompt: "Name a fruit. One word only.";
    readonly normalize: typeof firstWord;
}];
export type FingerprintLabel = (typeof FINGERPRINT_CELLS)[number]["label"];
export type AnswerClass = "valid" | "refusal" | "invalid" | "empty";
/** The canonical answer and its class for one reply to one cell. */
export declare function classifyAnswer(raw: string | null, cell: FingerprintCell): {
    answer: string | null;
    cls: AnswerClass;
};
export {};
//# sourceMappingURL=answer-fingerprint.d.ts.map