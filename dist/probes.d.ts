import type { ProviderConfig } from "./providers/config";
import type { ProbeLabel } from "./types";
export type ProbeDef = {
    label: ProbeLabel;
    maxTokens: number;
    buildPrompt: (nonce: string) => string;
    evaluate: (text: string, cfg: ProviderConfig) => boolean;
};
export declare const PROBES: readonly ProbeDef[];
//# sourceMappingURL=probes.d.ts.map