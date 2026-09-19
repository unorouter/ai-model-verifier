import { rec } from "../internal/utils";
import type { EnvelopeShape } from "./types";

export const ANTHROPIC_USAGE = new Set([
  "input_tokens",
  "output_tokens",
  "cache_read_input_tokens",
  "cache_creation_input_tokens",
]);
export const OPENAI_USAGE = new Set([
  "prompt_tokens",
  "completion_tokens",
  "total_tokens",
]);
export const GEMINI_USAGE = new Set([
  "promptTokenCount",
  "candidatesTokenCount",
  "totalTokenCount",
  "thoughtsTokenCount",
]);

/** Shape a reply body matches, regardless of which API was called. */
export function envelopeShapeOf(data: unknown): EnvelopeShape {
  const obj = rec(data) ?? {};
  const usageKeys = Object.keys(rec(obj["usage"]) ?? {});
  if (
    obj["candidates"] !== undefined ||
    usageKeys.some((k) => GEMINI_USAGE.has(k))
  )
    return "gemini";
  if (
    obj["choices"] !== undefined ||
    usageKeys.some((k) => OPENAI_USAGE.has(k))
  )
    return "openai";
  if (
    obj["content"] !== undefined ||
    usageKeys.some((k) => ANTHROPIC_USAGE.has(k))
  )
    return "anthropic";
  return "unknown";
}
