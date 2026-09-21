import type { VendorAdapter } from "./types";
export declare const VENDORS: readonly [{
    readonly id: "anthropic";
    readonly vendorName: "anthropic";
    readonly envelope: "anthropic";
    readonly fallbackWires: readonly ["openai"];
    readonly ops: {
        readonly chat: (req: import("./types").ChatRequest, ctx: import("./types").WireCtx) => {
            url: string;
            headers: Record<string, string>;
            body: Record<string, unknown>;
        };
        readonly countTokens: (req: import("./types").CountRequest, ctx: import("./types").WireCtx) => {
            url: string;
            headers: Record<string, string>;
            body: {
                model: string;
                messages: readonly import("./types").ChatMessage[];
            };
        };
    };
    readonly read: {
        readonly text: (data: unknown) => string | null;
        readonly meta: (data: unknown) => import("./types").ProbeMeta;
        readonly thinkingBlock: (data: unknown) => import("./types").ThinkingBlockRead | null;
        readonly countedTokens: (data: unknown) => number | null;
    };
    readonly defaultMaker: "anthropic";
}, {
    readonly id: "openai";
    readonly vendorName: "openai";
    readonly envelope: "openai";
    readonly fallbackWires: readonly [];
    readonly ops: {
        readonly chat: (req: import("./types").ChatRequest, ctx: import("./types").WireCtx) => {
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
                temperature?: number | undefined;
                top_p?: number | undefined;
                seed?: number | undefined;
            } | {
                max_tokens?: undefined;
                max_completion_tokens: number;
                model: string;
                messages: readonly import("./types").ChatMessage[];
                temperature?: number | undefined;
                top_p?: number | undefined;
                seed?: number | undefined;
            };
        };
    };
    readonly read: {
        readonly text: (data: unknown) => string | null;
        readonly meta: (data: unknown) => import("./types").ProbeMeta;
        readonly reasoningUsage: (data: unknown) => import("./types").ReasoningUsage | null;
    };
    readonly defaultMaker: "openai";
}, {
    readonly id: "gemini";
    readonly vendorName: "google";
    readonly envelope: "gemini";
    readonly fallbackWires: readonly ["openai"];
    readonly ops: {
        readonly chat: (req: import("./types").ChatRequest, ctx: import("./types").WireCtx) => {
            url: string;
            headers: {
                "content-type": string;
                "x-goog-api-key": string;
            };
            body: {
                contents: {
                    role: string;
                    parts: readonly unknown[];
                }[];
                generationConfig: {
                    maxOutputTokens: number;
                    temperature?: number | undefined;
                    topP?: number | undefined;
                    seed?: number | undefined;
                };
            };
        };
    };
    readonly read: {
        readonly text: (data: unknown) => string | null;
        readonly meta: (data: unknown) => import("./types").ProbeMeta;
        readonly reasoningUsage: (data: unknown) => import("./types").ReasoningUsage | null;
    };
    readonly defaultMaker: "google";
}];
export type VendorId = (typeof VENDORS)[number]["id"];
export declare function vendorFor<V extends string>(vendors: readonly VendorAdapter<V>[], id: string): VendorAdapter<V> | undefined;
//# sourceMappingURL=table.d.ts.map