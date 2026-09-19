import type { Maker } from "./types";
export declare const MAKERS: readonly [{
    readonly id: "anthropic";
    readonly name: "Anthropic";
    readonly wire: "anthropic";
    readonly models: readonly ["*claude*"];
    readonly home: readonly ["anthropic"];
    readonly modelNames: readonly ["claude", "anthropic"];
    readonly cloudModelNames: readonly ["amazon q", "q developer", "kiro"];
    readonly acceptsCloudHost: true;
    readonly tiers: readonly ["opus", "sonnet", "haiku", "fable"];
    readonly cjkNative: false;
}, {
    readonly id: "openai";
    readonly name: "OpenAI";
    readonly wire: "openai";
    readonly models: readonly ["gpt-*", "chatgpt*", "o1*", "o3*", "o4*"];
    readonly home: readonly ["openai"];
    readonly modelNames: readonly ["gpt", "chatgpt", "openai", "o1", "o3", "o4"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "google";
    readonly name: "Google";
    readonly wire: "gemini";
    readonly models: readonly ["*gemini*", "gemma*"];
    readonly home: readonly ["google", "deepmind"];
    readonly modelNames: readonly ["gemini", "google", "gemma"];
    readonly acceptsCloudHost: false;
    readonly tiers: readonly ["pro", "flash"];
    readonly cjkNative: false;
}, {
    readonly id: "deepseek";
    readonly name: "DeepSeek";
    readonly wire: "openai";
    readonly models: readonly ["deepseek*"];
    readonly home: readonly ["deepseek", "deepseek-ai", "深度求索"];
    readonly modelNames: readonly ["deepseek"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "moonshot";
    readonly name: "Moonshot AI";
    readonly wire: "openai";
    readonly models: readonly ["kimi*", "moonshot*"];
    readonly home: readonly ["moonshot", "moonshotai", "月之暗面"];
    readonly modelNames: readonly ["kimi"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "zhipu";
    readonly name: "Zhipu AI";
    readonly wire: "openai";
    readonly models: readonly ["glm*", "chatglm*"];
    readonly home: readonly ["zhipu", "zhipuai", "z.ai", "智谱"];
    readonly modelNames: readonly ["glm", "chatglm"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "minimax";
    readonly name: "MiniMax";
    readonly wire: "openai";
    readonly models: readonly ["minimax*", "abab*"];
    readonly home: readonly ["minimax", "minimaxai", "稀宇"];
    readonly modelNames: readonly ["minimax", "abab"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "xiaomi";
    readonly name: "Xiaomi";
    readonly wire: "openai";
    readonly models: readonly ["mimo*"];
    readonly home: readonly ["xiaomi", "小米"];
    readonly modelNames: readonly ["mimo"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "mistral";
    readonly name: "Mistral AI";
    readonly wire: "openai";
    readonly models: readonly ["mistral*", "mixtral*", "codestral*", "magistral*", "devstral*", "ministral*", "pixtral*"];
    readonly home: readonly ["mistral", "mistralai"];
    readonly modelNames: readonly ["mistral", "mixtral", "codestral", "magistral", "devstral", "ministral", "pixtral"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "alibaba";
    readonly name: "Alibaba";
    readonly wire: "openai";
    readonly models: readonly ["qwen*", "qwq*", "qvq*"];
    readonly home: readonly ["alibaba", "qwen", "tongyi", "阿里", "通义"];
    readonly modelNames: readonly ["qwen", "qwq", "qvq"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "meta";
    readonly name: "Meta";
    readonly wire: "openai";
    readonly models: readonly ["*llama*"];
    readonly home: readonly ["meta", "facebook"];
    readonly modelNames: readonly ["llama"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "xai";
    readonly name: "xAI";
    readonly wire: "openai";
    readonly models: readonly ["grok*"];
    readonly home: readonly ["xai", "x.ai"];
    readonly modelNames: readonly ["grok"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "writer";
    readonly name: "Writer";
    readonly wire: "openai";
    readonly models: readonly ["palmyra*"];
    readonly home: readonly [];
    readonly modelNames: readonly ["palmyra"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "tencent";
    readonly name: "Tencent";
    readonly wire: "openai";
    readonly models: readonly ["hunyuan*"];
    readonly home: readonly ["tencent", "hunyuan", "腾讯", "混元"];
    readonly modelNames: readonly ["hunyuan", "hy"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}];
export type MakerId = (typeof MAKERS)[number]["id"];
export declare function makerFor<M extends string>(makers: readonly Maker<M>[], id: string): Maker<M> | undefined;
//# sourceMappingURL=table.d.ts.map