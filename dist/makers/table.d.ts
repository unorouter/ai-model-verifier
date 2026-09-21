import type { Maker } from "./types";
export declare const MAKERS: readonly [{
    readonly id: "anthropic";
    readonly name: "Anthropic";
    readonly wire: "anthropic";
    readonly models: readonly ["*claude*", "kiro*"];
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
    readonly models: readonly ["gpt-*", "*-gpt-*", "chatgpt*", "o1*", "o3*", "o4*", "codex*", "*-codex*", "deep-research*"];
    readonly home: readonly ["openai"];
    readonly modelNames: readonly ["gpt", "chatgpt", "openai", "o1", "o3", "o4", "codex"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "google";
    readonly name: "Google";
    readonly wire: "gemini";
    readonly models: readonly ["*gemini*", "*gemma*", "antigravity*", "*nano-banana*"];
    readonly home: readonly ["google", "deepmind"];
    readonly modelNames: readonly ["gemini", "google", "gemma"];
    readonly acceptsCloudHost: false;
    readonly tiers: readonly ["pro", "flash"];
    readonly cjkNative: false;
}, {
    readonly id: "deepseek";
    readonly name: "DeepSeek";
    readonly wire: "openai";
    readonly models: readonly ["*deepseek*", "*dsv3*", "*dsv4*", "*dsv5*"];
    readonly home: readonly ["deepseek", "deepseek-ai", "深度求索"];
    readonly modelNames: readonly ["deepseek"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
    readonly selfConfusions: readonly ["openai", "gpt", "chatgpt", "anthropic", "claude"];
}, {
    readonly id: "moonshot";
    readonly name: "Moonshot AI";
    readonly wire: "openai";
    readonly models: readonly ["*kimi*", "moonshot*"];
    readonly home: readonly ["moonshot", "moonshotai", "月之暗面"];
    readonly modelNames: readonly ["kimi"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "zhipu";
    readonly name: "Zhipu AI";
    readonly wire: "openai";
    readonly models: readonly ["*glm*"];
    readonly home: readonly ["zhipu", "zhipuai", "z.ai", "智谱"];
    readonly modelNames: readonly ["glm", "chatglm"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "minimax";
    readonly name: "MiniMax";
    readonly wire: "openai";
    readonly models: readonly ["*minimax*", "abab*"];
    readonly home: readonly ["minimax", "minimaxai", "稀宇"];
    readonly modelNames: readonly ["minimax", "abab"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "xiaomi";
    readonly name: "Xiaomi";
    readonly wire: "openai";
    readonly models: readonly ["*mimo*"];
    readonly home: readonly ["xiaomi", "小米"];
    readonly modelNames: readonly ["mimo"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "mistral";
    readonly name: "Mistral AI";
    readonly wire: "openai";
    readonly models: readonly ["*mistral*", "*mixtral*", "*codestral*", "*magistral*", "*devstral*", "*ministral*", "*pixtral*", "*leanstral*"];
    readonly home: readonly ["mistral", "mistralai"];
    readonly modelNames: readonly ["mistral", "mixtral", "codestral", "magistral", "devstral", "ministral", "pixtral", "leanstral"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "alibaba";
    readonly name: "Alibaba";
    readonly wire: "openai";
    readonly models: readonly ["*qwen*", "*qwq*", "*qvq*"];
    readonly home: readonly ["alibaba", "qwen", "tongyi", "阿里", "通义"];
    readonly modelNames: readonly ["qwen", "qwq", "qvq"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "meta";
    readonly name: "Meta";
    readonly wire: "openai";
    readonly models: readonly ["*llama*", "l3-*", "l31-*", "*muse-spark*", "*muse-glimmer*"];
    readonly home: readonly ["meta", "facebook"];
    readonly modelNames: readonly ["llama", "muse"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "xai";
    readonly name: "xAI";
    readonly wire: "openai";
    readonly models: readonly ["*grok*"];
    readonly home: readonly ["xai", "x.ai"];
    readonly modelNames: readonly ["grok"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "writer";
    readonly name: "Writer";
    readonly wire: "openai";
    readonly models: readonly ["*palmyra*"];
    readonly home: readonly [];
    readonly modelNames: readonly ["palmyra"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "tencent";
    readonly name: "Tencent";
    readonly wire: "openai";
    readonly models: readonly ["*hunyuan*", "hy3*", "hy4*", "hy-*"];
    readonly home: readonly ["tencent", "hunyuan", "腾讯", "混元"];
    readonly modelNames: readonly ["hunyuan", "hy"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "cohere";
    readonly name: "Cohere";
    readonly wire: "openai";
    readonly models: readonly ["command*", "*-command-*", "c4ai*", "aya-*", "*-aya-*", "tiny-aya*", "north-*"];
    readonly home: readonly ["cohere", "cohere labs", "coherelabs"];
    readonly modelNames: readonly ["command", "aya", "c4ai"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "bytedance";
    readonly name: "ByteDance";
    readonly wire: "openai";
    readonly models: readonly ["*doubao*", "seed-*", "*-seed-*", "seedream*", "seedance*"];
    readonly home: readonly ["bytedance", "volcengine", "字节跳动", "火山引擎"];
    readonly modelNames: readonly ["doubao", "seed"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "baidu";
    readonly name: "Baidu";
    readonly wire: "openai";
    readonly models: readonly ["*ernie*"];
    readonly home: readonly ["baidu", "百度"];
    readonly modelNames: readonly ["ernie"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "stepfun";
    readonly name: "StepFun";
    readonly wire: "openai";
    readonly models: readonly ["step-*", "*-step-*"];
    readonly home: readonly ["stepfun", "阶跃星辰"];
    readonly modelNames: readonly ["stepfun"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "nvidia";
    readonly name: "NVIDIA";
    readonly wire: "openai";
    readonly models: readonly ["*nemotron*", "*riva-*"];
    readonly home: readonly ["nvidia"];
    readonly modelNames: readonly ["nemotron"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "ibm";
    readonly name: "IBM";
    readonly wire: "openai";
    readonly models: readonly ["*granite*"];
    readonly home: readonly ["ibm"];
    readonly modelNames: readonly ["granite"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "liquid";
    readonly name: "Liquid AI";
    readonly wire: "openai";
    readonly models: readonly ["lfm*", "*-lfm-*"];
    readonly home: readonly ["liquid", "liquid ai"];
    readonly modelNames: readonly ["lfm"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "kwaipilot";
    readonly name: "Kwaipilot";
    readonly wire: "openai";
    readonly models: readonly ["*kat-coder*"];
    readonly home: readonly ["kwaipilot", "kuaishou", "快手"];
    readonly modelNames: readonly ["kat-coder"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "meituan";
    readonly name: "Meituan";
    readonly wire: "openai";
    readonly models: readonly ["*longcat*"];
    readonly home: readonly ["meituan", "美团"];
    readonly modelNames: readonly ["longcat"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "inclusionai";
    readonly name: "inclusionAI";
    readonly wire: "openai";
    readonly models: readonly ["ling-*", "*-ling-*", "ring-*", "*-ring-*"];
    readonly home: readonly ["inclusionai", "ant group", "蚂蚁"];
    readonly modelNames: readonly ["inclusionai"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "internlm";
    readonly name: "Shanghai AI Lab";
    readonly wire: "openai";
    readonly models: readonly ["intern*", "*-intern-*"];
    readonly home: readonly ["shanghai ai lab", "internlm", "上海人工智能实验室", "书生"];
    readonly modelNames: readonly ["internlm", "internvl", "intern-s"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "openbmb";
    readonly name: "OpenBMB";
    readonly wire: "openai";
    readonly models: readonly ["*minicpm*"];
    readonly home: readonly ["openbmb", "modelbest", "面壁"];
    readonly modelNames: readonly ["minicpm"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "sensetime";
    readonly name: "SenseTime";
    readonly wire: "openai";
    readonly models: readonly ["*sensenova*", "*sensechat*"];
    readonly home: readonly ["sensetime", "商汤"];
    readonly modelNames: readonly ["sensenova", "sensechat"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "rednote";
    readonly name: "rednote";
    readonly wire: "openai";
    readonly models: readonly ["dots*", "*-dots-*"];
    readonly home: readonly ["rednote", "xiaohongshu", "小红书"];
    readonly modelNames: readonly ["dots"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: true;
}, {
    readonly id: "perplexity";
    readonly name: "Perplexity";
    readonly wire: "openai";
    readonly models: readonly ["sonar*", "*-sonar-*"];
    readonly home: readonly ["perplexity"];
    readonly modelNames: readonly ["sonar"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "microsoft";
    readonly name: "Microsoft";
    readonly wire: "openai";
    readonly models: readonly ["phi-*", "phi3*", "phi4*", "phi5*", "*-phi-*"];
    readonly home: readonly ["microsoft"];
    readonly modelNames: readonly ["phi"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "amazon";
    readonly name: "Amazon";
    readonly wire: "openai";
    readonly models: readonly ["nova-*", "*-nova-*"];
    readonly home: readonly ["amazon", "aws"];
    readonly modelNames: readonly ["nova"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "ai21";
    readonly name: "AI21 Labs";
    readonly wire: "openai";
    readonly models: readonly ["*jamba*"];
    readonly home: readonly ["ai21"];
    readonly modelNames: readonly ["jamba"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "nous";
    readonly name: "Nous Research";
    readonly wire: "openai";
    readonly models: readonly ["hermes*", "*-hermes-*"];
    readonly home: readonly ["nous", "nous research"];
    readonly modelNames: readonly ["hermes"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "poolside";
    readonly name: "Poolside";
    readonly wire: "openai";
    readonly models: readonly ["laguna*", "*-laguna-*"];
    readonly home: readonly ["poolside"];
    readonly modelNames: readonly ["laguna"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "swissai";
    readonly name: "Swiss AI";
    readonly wire: "openai";
    readonly models: readonly ["*apertus*"];
    readonly home: readonly ["swiss ai", "swiss-ai", "eth zurich", "epfl"];
    readonly modelNames: readonly ["apertus"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "inception";
    readonly name: "Inception Labs";
    readonly wire: "openai";
    readonly models: readonly ["mercury*"];
    readonly home: readonly ["inception", "inception labs"];
    readonly modelNames: readonly ["mercury"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "arcee";
    readonly name: "Arcee AI";
    readonly wire: "openai";
    readonly models: readonly ["trinity*", "*-trinity-*", "*arcee*"];
    readonly home: readonly ["arcee"];
    readonly modelNames: readonly ["trinity"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "nexagi";
    readonly name: "Nex AGI";
    readonly wire: "openai";
    readonly models: readonly ["nex-*", "*-nex-*"];
    readonly home: readonly ["nex", "nex agi", "nex-agi"];
    readonly modelNames: readonly ["nex-n"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "sarvam";
    readonly name: "Sarvam AI";
    readonly wire: "openai";
    readonly models: readonly ["sarvam*"];
    readonly home: readonly ["sarvam"];
    readonly modelNames: readonly ["sarvam"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "typhoon";
    readonly name: "SCB 10X";
    readonly wire: "openai";
    readonly models: readonly ["typhoon*"];
    readonly home: readonly ["scb 10x", "scb10x", "typhoon"];
    readonly modelNames: readonly ["typhoon"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "moondream";
    readonly name: "Moondream";
    readonly wire: "openai";
    readonly models: readonly ["moondream*"];
    readonly home: readonly ["moondream", "m87"];
    readonly modelNames: readonly ["moondream"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "jetbrains";
    readonly name: "JetBrains";
    readonly wire: "openai";
    readonly models: readonly ["mellum*"];
    readonly home: readonly ["jetbrains"];
    readonly modelNames: readonly ["mellum"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "aion";
    readonly name: "Aion Labs";
    readonly wire: "openai";
    readonly models: readonly ["aion-*", "*-aion-*"];
    readonly home: readonly ["aion labs", "aion-labs", "aionlabs"];
    readonly modelNames: readonly ["aion"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}, {
    readonly id: "venice";
    readonly name: "Venice";
    readonly wire: "openai";
    readonly models: readonly ["venice-*"];
    readonly home: readonly ["venice"];
    readonly modelNames: readonly ["venice"];
    readonly acceptsCloudHost: false;
    readonly tiers: null;
    readonly cjkNative: false;
}];
export type MakerId = (typeof MAKERS)[number]["id"];
export declare function makerFor<M extends string>(makers: readonly Maker<M>[], id: string): Maker<M> | undefined;
//# sourceMappingURL=table.d.ts.map