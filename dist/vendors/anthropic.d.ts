import { type ChatRequest, type CountRequest, type ProbeMeta, type ThinkingBlockRead, type WireCtx } from "./types";
declare function chat(req: ChatRequest, ctx: WireCtx): {
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
};
declare function countTokens(req: CountRequest, ctx: WireCtx): {
    url: string;
    headers: Record<string, string>;
    body: {
        model: string;
        messages: readonly import("./types").ChatMessage[];
    };
};
declare function text(data: unknown): string | null;
declare function meta(data: unknown): ProbeMeta;
declare function thinkingBlock(data: unknown): ThinkingBlockRead | null;
declare function countedTokens(data: unknown): number | null;
export declare const anthropicVendor: {
    readonly id: "anthropic";
    readonly vendorName: "anthropic";
    readonly envelope: "anthropic";
    readonly fallbackWires: readonly ["openai"];
    readonly ops: {
        readonly chat: typeof chat;
        readonly countTokens: typeof countTokens;
    };
    readonly read: {
        readonly text: typeof text;
        readonly meta: typeof meta;
        readonly thinkingBlock: typeof thinkingBlock;
        readonly countedTokens: typeof countedTokens;
    };
    readonly defaultMaker: "anthropic";
};
export {};
//# sourceMappingURL=anthropic.d.ts.map