import type { VerifyProvider } from "./types";
export declare const CURATED_MODELS: Record<VerifyProvider, readonly string[]>;
export declare function vendorForRow(provider: VerifyProvider, model?: string): string;
export declare function providerForModel(model: string): VerifyProvider | null;
//# sourceMappingURL=models.d.ts.map