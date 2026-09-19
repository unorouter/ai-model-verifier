import { type ChatRequest, type ProbeMeta, type ReasoningUsage, type WireCtx } from "./types";
declare function chat(req: ChatRequest, ctx: WireCtx): {
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
        };
    };
};
declare function text(data: unknown): string | null;
declare function meta(data: unknown): ProbeMeta;
declare function reasoningUsage(data: unknown): ReasoningUsage | null;
export declare const geminiVendor: {
    readonly id: "gemini";
    readonly vendorName: "google";
    readonly envelope: "gemini";
    readonly fallbackWires: readonly ["openai"];
    readonly ops: {
        readonly chat: typeof chat;
    };
    readonly read: {
        readonly text: typeof text;
        readonly meta: typeof meta;
        readonly reasoningUsage: typeof reasoningUsage;
    };
    readonly defaultMaker: "google";
};
export {};
//# sourceMappingURL=gemini.d.ts.map