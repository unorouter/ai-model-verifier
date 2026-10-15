import { intOf, rec, strOf } from "../internal/utils";
import { normalizeBaseUrl } from "./base-url";
import {
  defineVendor,
  type ChatRequest,
  type ProbeMeta,
  type ReasoningUsage,
  type WireCtx,
} from "./types";

type GeminiResponse = {
  error?: unknown;
  modelVersion?: string;
  candidates?: Array<{
    finishReason?: unknown;
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: unknown;
    candidatesTokenCount?: unknown;
    totalTokenCount?: unknown;
    thoughtsTokenCount?: unknown;
  };
};

/** A thinking budget would otherwise eat the whole output cap. */
const MIN_OUTPUT_TOKENS = 1024;

function chat(req: ChatRequest, ctx: WireCtx) {
  return {
    url: `${normalizeBaseUrl(ctx.baseUrl)}/v1beta/models/${req.model}:generateContent`,
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": ctx.apiKey,
    },
    body: {
      contents: req.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts:
          typeof m.content === "string" ? [{ text: m.content }] : m.content,
      })),
      generationConfig: {
        maxOutputTokens: Math.max(req.maxTokens, MIN_OUTPUT_TOKENS),
        ...(req.temperature !== undefined
          ? { temperature: req.temperature }
          : {}),
        ...(req.topP !== undefined ? { topP: req.topP } : {}),
        ...(req.seed !== undefined ? { seed: req.seed } : {}),
        ...(req.reasoningEffort
          ? {
              thinkingConfig: {
                thinkingLevel: req.reasoningEffort,
                includeThoughts: true,
              },
            }
          : {}),
      },
    },
  };
}

function text(data: unknown): string | null {
  const d: GeminiResponse = rec(data) ?? {};
  if (d.error) return null;
  const parts = d.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  return parts
    .map((p) => p.text ?? "")
    .join(" ")
    .toLowerCase();
}

function reasoningText(data: unknown): string | null {
  const d: GeminiResponse = rec(data) ?? {};
  const thoughts = (d.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => p.thought === true && typeof p.text === "string")
    .map((p) => p.text ?? "");
  return thoughts.length > 0 ? thoughts.join(" ").toLowerCase() : null;
}

function meta(data: unknown): ProbeMeta {
  const d: GeminiResponse = rec(data) ?? {};
  const u = d.usageMetadata;
  return {
    detectedModel: typeof d.modelVersion === "string" ? d.modelVersion : null,
    usage: u
      ? {
          prompt: intOf(u.promptTokenCount),
          completion: intOf(u.candidatesTokenCount),
          total: intOf(u.totalTokenCount),
        }
      : null,
    finishReason: strOf(d.candidates?.[0]?.finishReason),
  };
}

function reasoningUsage(data: unknown): ReasoningUsage | null {
  const d: GeminiResponse = rec(data) ?? {};
  const u = d.usageMetadata;
  if (!u || typeof u !== "object") return null;
  return {
    completion: intOf(u.candidatesTokenCount),
    reasoning: intOf(u.thoughtsTokenCount),
  };
}

export const geminiVendor = defineVendor({
  id: "gemini",
  vendorName: "google",
  envelope: "gemini",
  fallbackWires: ["openai"],
  ops: { chat },
  read: { text, meta, reasoningUsage, reasoningText },
  defaultMaker: "google",
});
