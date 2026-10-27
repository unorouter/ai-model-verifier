import { intOf, rec, strOf } from "../internal/utils";
import { normalizeBaseUrl } from "./base-url";
import {
  defineVendor,
  type ChatRequest,
  type CountRequest,
  type ProbeMeta,
  type ThinkingBlockRead,
  type WireCtx,
} from "./types";

type ContentBlock = {
  type?: string;
  text?: string;
  signature?: string;
  thinking?: string;
};

type AnthropicResponse = {
  type?: string;
  model?: string;
  content?: unknown;
  stop_reason?: unknown;
  usage?: {
    input_tokens?: unknown;
    output_tokens?: unknown;
    cache_read_input_tokens?: unknown;
    cache_creation_input_tokens?: unknown;
  };
  input_tokens?: unknown;
};

// Anthropic refuses a browser preflight unless the caller opts in with this
// header, and every relay that reimplements their API inherits the rule. The
// header is meaningless to endpoints that do not check it, so it goes on every
// direct probe rather than guessing which hosts enforce it.
const BROWSER_ACCESS_HEADER = "anthropic-dangerous-direct-browser-access";

function headers(ctx: WireCtx): Record<string, string> {
  const h: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": ctx.apiKey,
    "anthropic-version": "2023-06-01",
  };
  if (ctx.direct) h[BROWSER_ACCESS_HEADER] = "true";
  return h;
}

const blocksOf = (data: unknown): ContentBlock[] => {
  const d: AnthropicResponse = rec(data) ?? {};
  return Array.isArray(d.content)
    ? d.content.filter((b): b is ContentBlock => !!b && typeof b === "object")
    : [];
};

function chat(req: ChatRequest, ctx: WireCtx) {
  const body: Record<string, unknown> = {
    model: req.model,
    max_tokens: req.maxTokens,
    messages: req.messages,
  };
  // The API rejects temperature next to thinking; there is no seed.
  if (req.temperature !== undefined && !req.thinking)
    body["temperature"] = req.temperature;
  if (req.topP !== undefined && !req.thinking) body["top_p"] = req.topP;
  if (req.thinking) {
    body["thinking"] =
      req.thinking.kind === "extended"
        ? { type: "enabled", budget_tokens: req.thinking.budgetTokens }
        : { type: "adaptive", display: "summarized" };
    // Sibling of `thinking`, never nested inside it: nesting is a 400.
    if (req.thinking.kind === "adaptive")
      body["output_config"] = { effort: "xhigh" };
  }
  return {
    url: `${normalizeBaseUrl(ctx.baseUrl)}/v1/messages`,
    headers: headers(ctx),
    body,
  };
}

function countTokens(req: CountRequest, ctx: WireCtx) {
  return {
    url: `${normalizeBaseUrl(ctx.baseUrl)}/v1/messages/count_tokens`,
    headers: headers(ctx),
    body: { model: req.model, messages: req.messages },
  };
}

function text(data: unknown): string | null {
  const d: AnthropicResponse = rec(data) ?? {};
  if (d.type === "error") return null;
  return blocksOf(data)
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join(" ")
    .toLowerCase();
}

function reasoningText(data: unknown): string | null {
  const thoughts = blocksOf(data)
    .filter((b) => b.type === "thinking" && typeof b.thinking === "string")
    .map((b) => b.thinking ?? "");
  return thoughts.length > 0 ? thoughts.join(" ").toLowerCase() : null;
}

function meta(data: unknown): ProbeMeta {
  const d: AnthropicResponse = rec(data) ?? {};
  const u = d.usage;
  // input_tokens leaves out cache reads and writes: a caching lane (gg's
  // Claude) billed our script runs 0 to 16 that way and read as made up usage.
  const input = intOf(u?.input_tokens);
  const prompt =
    input === null
      ? null
      : input +
        (intOf(u?.cache_read_input_tokens) ?? 0) +
        (intOf(u?.cache_creation_input_tokens) ?? 0);
  const completion = intOf(u?.output_tokens);
  return {
    detectedModel: typeof d.model === "string" ? d.model : null,
    usage: u
      ? {
          prompt,
          completion,
          total:
            prompt !== null && completion !== null ? prompt + completion : null,
        }
      : null,
    finishReason: strOf(d.stop_reason),
  };
}

function thinkingBlock(data: unknown): ThinkingBlockRead | null {
  for (const b of blocksOf(data)) {
    if (b.type !== "thinking" && b.type !== "redacted_thinking") continue;
    return {
      block: b,
      signature: typeof b.signature === "string" ? b.signature : "",
      chars: typeof b.thinking === "string" ? b.thinking.length : 0,
    };
  }
  return null;
}

function countedTokens(data: unknown): number | null {
  const d: AnthropicResponse = rec(data) ?? {};
  return intOf(d.input_tokens);
}

export const anthropicVendor = defineVendor({
  id: "anthropic",
  vendorName: "anthropic",
  envelope: "anthropic",
  fallbackWires: ["openai"],
  ops: { chat, countTokens },
  read: { text, meta, thinkingBlock, countedTokens, reasoningText },
  defaultMaker: "anthropic",
});
