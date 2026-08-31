import type { ProbeUsage, VerifyProvider } from "../types";
export type ProbeMeta = {
    detectedModel: string | null;
    usage: ProbeUsage | null;
};
export type ProbeRequestArgs = {
    baseUrl: string;
    apiKey: string;
    model: string;
    prompt: string;
    maxTokens: number;
    direct: boolean;
};
export type BuiltRequest = {
    url: string;
    headers: Record<string, string>;
    body: unknown;
};
/** Providers append their own version segment, so a pasted one would double it. */
export declare function normalizeProbeBaseUrl(baseUrl: string): string;
export type ProviderConfig = {
    provider: VerifyProvider;
    buildRequest: (args: ProbeRequestArgs) => BuiltRequest;
    extractText: (data: unknown) => string | null;
    extractMeta: (data: unknown) => ProbeMeta;
    homeIdentityPatterns: string[];
    foreignIdentityPatterns: string[];
    homeModelNamePatterns: string[];
    cloudModelNamePatterns: string[];
    tiers: readonly string[] | null;
    acceptsCloudHostIdentity: boolean;
};
export declare const PROVIDER_CONFIGS: Record<VerifyProvider, ProviderConfig>;
//# sourceMappingURL=config.d.ts.map