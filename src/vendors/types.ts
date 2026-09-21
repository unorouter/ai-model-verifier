import type { ModelFacts } from "../models/facts";

/** Vendor whose response shape a payload looks like. */
export type EnvelopeShape = "anthropic" | "openai" | "gemini" | "unknown";

export type ProbeUsage = {
  prompt: number | null;
  completion: number | null;
  total: number | null;
};

export type ChatMessage = {
  role: "user" | "assistant";
  /** A string, or the vendor's own content blocks (a replayed thinking block). */
  content: string | readonly unknown[];
};

export type ThinkingSpec = {
  kind: "adaptive" | "extended";
  budgetTokens: number;
};

export type ChatRequest = {
  model: string;
  maxTokens: number;
  messages: readonly ChatMessage[];
  thinking?: ThinkingSpec;
  /** Sampling controls; absent means the endpoint's default. */
  temperature?: number;
  topP?: number;
  seed?: number;
};

export type CountRequest = {
  model: string;
  messages: readonly ChatMessage[];
};

export type WireCtx = {
  baseUrl: string;
  apiKey: string;
  /** The request leaves a browser: some vendors want an opt-in header. */
  direct: boolean;
  facts: ModelFacts<string>;
};

export type BuiltRequest = {
  url: string;
  headers: Record<string, string>;
  body: unknown;
};

export type ProbeMeta = {
  detectedModel: string | null;
  usage: ProbeUsage | null;
};

export type ThinkingBlockRead = {
  /** The raw block, for replay. */
  block: unknown;
  signature: string;
  chars: number;
};

export type ReasoningUsage = {
  completion: number | null;
  reasoning: number | null;
};

/**
 * One wire format. Every request the engine makes goes through `ops`, every
 * reply is read through `read`, so a rule never knows a URL or a header name.
 */
export type VendorAdapter<Id extends string = string> = {
  id: Id;
  /** Name shown in reports ("google" for the gemini wire). */
  vendorName: string;
  envelope: EnvelopeShape;
  /** Wires the handshake tries after this one, in order. */
  fallbackWires: readonly string[];
  ops: {
    chat(req: ChatRequest, ctx: WireCtx): BuiltRequest;
    countTokens?(req: CountRequest, ctx: WireCtx): BuiltRequest;
  };
  read: {
    /** Lowercased reply text; null on an error envelope. */
    text(data: unknown): string | null;
    meta(data: unknown): ProbeMeta;
    thinkingBlock?(data: unknown): ThinkingBlockRead | null;
    reasoningUsage?(data: unknown): ReasoningUsage | null;
    countedTokens?(data: unknown): number | null;
  };
  /** Maker whose vocabulary judges a model the facts table does not know. */
  defaultMaker: string;
};

export const defineVendor = <const V extends VendorAdapter>(vendor: V): V =>
  vendor;
