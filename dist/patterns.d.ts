export declare const CODING_TOOL_REFUSAL_PATTERNS: string[];
export declare const CODING_TOOL_NAMES: string[];
export declare const SCAM_PAGE_PATTERNS: string[];
export declare const VENDOR_PATTERNS: {
    readonly anthropic: readonly ["anthropic", "claude"];
    readonly openai: readonly ["openai", "chatgpt", "gpt-3", "gpt-4", "gpt-5", "o1-", "o3-", "o4-"];
    readonly google: readonly ["google", "deepmind", "gemini"];
    readonly other: readonly ["deepseek", "qwen", "moonshot", "kimi", "mistral", "llama", "meta", "grok", "xai", "zhipu"];
};
export type VendorKey = keyof typeof VENDOR_PATTERNS;
export declare function foreignPatternsExcept(home: VendorKey): string[];
export declare const CLOUD_HOST_PATTERNS: string[];
export declare const FAKE_RESPONSE_SIGNATURES: string[];
export declare const CJK_CHAR: RegExp;
export declare const CJK_LEAK_MIN_CHARS = 4;
//# sourceMappingURL=patterns.d.ts.map