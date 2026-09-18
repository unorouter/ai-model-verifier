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
    facts: ModelFacts;
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
export type VendorIdentity = {
    /** Words a genuine model uses for its maker. */
    home: readonly string[];
    /** Words that name a competitor. */
    foreign: readonly string[];
    homeModelNames: readonly string[];
    /** Model names a cloud host sells under its own badge (Amazon Q over Claude). */
    cloudModelNames: readonly string[];
    /** A cloud host named as the maker still counts as home (Bedrock is Claude). */
    acceptsCloudHost: boolean;
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
    identity: VendorIdentity;
    /** Tier vocabulary for tier checks; null when the vendor sells no tiers. */
    tiers: readonly string[] | null;
};
export declare const defineVendor: <const V extends VendorAdapter>(vendor: V) => V;
//# sourceMappingURL=types.d.ts.map