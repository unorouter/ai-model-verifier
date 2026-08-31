import { anthropicConfig } from "./anthropic";
import { geminiConfig } from "./gemini";
import { openaiConfig } from "./openai";
const VERSION_SUFFIX = /\/(?:v\d+(?:alpha|beta)?)\/*$/i;
/** Providers append their own version segment, so a pasted one would double it. */
export function normalizeProbeBaseUrl(baseUrl) {
    return baseUrl.trim().replace(/\/+$/, "").replace(VERSION_SUFFIX, "");
}
export const PROVIDER_CONFIGS = {
    anthropic: anthropicConfig,
    openai: openaiConfig,
    gemini: geminiConfig,
};
//# sourceMappingURL=config.js.map