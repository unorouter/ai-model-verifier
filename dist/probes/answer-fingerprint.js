/**
 * The answer fingerprint battery: one-word questions whose answer distribution
 * at temperature 1 is model specific ("One Token Is Enough", arXiv
 * 2607.10252). No nonce and no paraphrase: the prompt bytes must be identical
 * across lanes and runs, or two distributions are not comparable. Nothing here
 * judges; the rule reports counts and a caller accumulates them over days.
 */
const NUMBER_WORDS = {
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
    eleven: "11",
    twelve: "12",
    thirteen: "13",
    fourteen: "14",
    fifteen: "15",
    sixteen: "16",
    seventeen: "17",
    eighteen: "18",
    nineteen: "19",
    twenty: "20",
    thirty: "30",
    forty: "40",
    fifty: "50",
    sixty: "60",
    seventy: "70",
    eighty: "80",
    ninety: "90",
    hundred: "100",
};
const COLOUR_ALIASES = {
    gray: "grey",
    colour: "",
    color: "",
};
const REFUSAL = /\b(cannot|can't|unable|won't|not able|as an ai|i do not|i don't)\b/;
/** Reasoning leaked into the content is stripped before the answer is read. */
export const stripThink = (text) => text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*$/, "");
const words = (text) => stripThink(text)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
const firstWord = (text) => words(text)[0] ?? null;
const firstNumber = (text, min, max) => {
    for (const w of words(text)) {
        const n = /^\d+$/.test(w) ? Number(w) : NUMBER_WORDS[w] ? Number(NUMBER_WORDS[w]) : null;
        if (n !== null && n >= min && n <= max)
            return String(n);
    }
    return null;
};
const oneOf = (allowed) => (text) => {
    for (const w of words(text))
        if (allowed.includes(w))
            return w;
    return null;
};
export const FINGERPRINT_CELLS = [
    {
        label: "number",
        prompt: "Pick a random integer from 1 to 100. Reply with the number only.",
        normalize: (t) => firstNumber(t, 1, 100),
    },
    {
        label: "colour",
        prompt: "Name a colour. One word only.",
        normalize: (t) => {
            for (const w of words(t)) {
                const c = COLOUR_ALIASES[w] ?? w;
                if (c)
                    return c;
            }
            return null;
        },
    },
    {
        label: "letter",
        prompt: "Pick a random letter of the alphabet. Reply with the letter only.",
        normalize: (t) => {
            for (const w of words(t))
                if (/^[a-z]$/.test(w))
                    return w;
            const f = firstWord(t);
            return f && /^[a-z]/.test(f) ? f[0] : null;
        },
    },
    {
        label: "city",
        prompt: "Name a city. One word only.",
        normalize: firstWord,
    },
    {
        label: "coin",
        prompt: "Flip a coin. Reply with heads or tails only.",
        normalize: oneOf(["heads", "tails", "head", "tail"]),
    },
    {
        label: "animal",
        prompt: "Name an animal. One word only.",
        normalize: firstWord,
    },
    {
        label: "favourite",
        prompt: "What is your favourite number from 1 to 10? Reply with the number only.",
        normalize: (t) => firstNumber(t, 1, 10),
    },
    {
        label: "fruit",
        prompt: "Name a fruit. One word only.",
        normalize: firstWord,
    },
];
/** The canonical answer and its class for one reply to one cell. */
export function classifyAnswer(raw, cell) {
    if (raw === null || stripThink(raw).trim().length === 0)
        return { answer: null, cls: "empty" };
    const answer = cell.normalize(raw);
    if (answer !== null)
        return { answer, cls: "valid" };
    return {
        answer: null,
        cls: REFUSAL.test(raw.toLowerCase()) ? "refusal" : "invalid",
    };
}
//# sourceMappingURL=answer-fingerprint.js.map