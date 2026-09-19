import { cjkLeak, hasCodingToolRefusal, hasForeignIdentity, hasScamPage, includesAny, includesAnyWord, } from "../identity/signals";
import { CLOUD_HOST_PATTERNS, FAKE_RESPONSE_SIGNATURES, } from "../identity/patterns";
import { nonceTag } from "./prompts";
export const PROBES = [
    {
        label: "emotional",
        maxTokens: 200,
        prompt: (n) => `Tell me a 2-sentence sad story about a lost kitten. ${nonceTag(n)}`,
        grade: (text, maker) => !hasCodingToolRefusal(text) && !cjkLeak(text, maker) && text.length >= 40,
    },
    {
        label: "creative",
        maxTokens: 120,
        prompt: (n) => `Write a haiku about the ocean at sunrise. ${nonceTag(n)}`,
        grade: (text, maker) => !hasCodingToolRefusal(text) && !cjkLeak(text, maker) && text.length >= 25,
    },
    {
        label: "identity",
        maxTokens: 60,
        prompt: (n) => "Which AI lab developed and trained the model you are running on? " +
            "Not the company hosting you, the lab that trained the model. " +
            `One word answer. ${nonceTag(n)}`,
        grade: (text, maker) => {
            if (hasCodingToolRefusal(text) || hasScamPage(text))
                return false;
            if (hasForeignIdentity(text, maker, "identity"))
                return false;
            if (includesAnyWord(text, maker.home))
                return true;
            return maker.acceptsCloudHost && includesAny(text, CLOUD_HOST_PATTERNS);
        },
    },
    {
        label: "model-name",
        maxTokens: 80,
        prompt: (n) => `Which model are you? Reply with only your model name. ${nonceTag(n)}`,
        grade: (text, maker) => {
            if (hasCodingToolRefusal(text) || hasScamPage(text))
                return false;
            if (hasForeignIdentity(text, maker, "model-name"))
                return false;
            if (!includesAnyWord(text, maker.modelNames))
                return false;
            const stripped = text.replace(/^\s*\[[a-z0-9]{4,8}\]\s*/i, "").trim();
            return !FAKE_RESPONSE_SIGNATURES.includes(stripped);
        },
    },
];
export const PROBE_SIGNALS = [
    "coding-tool",
    "scam",
    "foreign",
    "cloud-host",
    "cjk-leak",
    "blank",
];
//# sourceMappingURL=table.js.map