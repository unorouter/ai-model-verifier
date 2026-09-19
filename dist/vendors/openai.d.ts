import { type ChatRequest, type ProbeMeta, type ReasoningUsage, type WireCtx } from "./types";
declare function chat(req: ChatRequest, ctx: WireCtx): {
    url: string;
    headers: {
        "content-type": string;
        authorization: string;
    };
    body: {
        max_tokens: number;
        max_completion_tokens?: undefined;
        model: string;
        messages: readonly import("./types").ChatMessage[];
    } | {
        max_tokens?: undefined;
        max_completion_tokens: number;
        model: string;
        messages: readonly import("./types").ChatMessage[];
    };
};
declare function text(data: unknown): string | null;
declare function meta(data: unknown): ProbeMeta;
declare function reasoningUsage(data: unknown): ReasoningUsage | null;
export declare const openaiVendor: {
    readonly id: "openai";
    readonly vendorName: "openai";
    readonly envelope: "openai";
    readonly fallbackWires: readonly [];
    readonly ops: {
        readonly chat: typeof chat;
    };
    readonly read: {
        readonly text: typeof text;
        readonly meta: typeof meta;
        readonly reasoningUsage: typeof reasoningUsage;
    };
    readonly defaultMaker: "openai";
};
export {};
//# sourceMappingURL=openai.d.ts.map