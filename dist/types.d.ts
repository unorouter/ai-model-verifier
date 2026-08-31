import type { SignatureResult } from "./detectors/thinking-signature";
export type VerifyProvider = "anthropic" | "openai" | "gemini";
export type VerifyVerdict = "genuine" | "suspicious" | "unverified";
export type ProbeLabel = "emotional" | "creative" | "identity" | "model-name";
export type ProbeSignal = "coding-tool" | "scam" | "foreign" | "cloud-host" | "cjk-leak" | "blank" | null;
export type TransportMode = "direct" | "server";
export type ProbeUsage = {
    prompt: number | null;
    completion: number | null;
    total: number | null;
};
export type ProbeOutcome = {
    label: ProbeLabel;
    pass: boolean;
    signal: ProbeSignal;
    muxFailure: boolean;
    transient: boolean;
    latencyMs: number;
    prompt: string;
    responseText: string | null;
    httpStatus: number | null;
    usage: ProbeUsage | null;
    detectedModel: string | null;
    reason: string | null;
};
export type VerifyResult = {
    provider: VerifyProvider;
    model: string;
    baseUrlHost: string;
    verdict: VerifyVerdict;
    versionUnverifiable: boolean;
    probes: ProbeOutcome[];
    reasons: string[];
    probesPassed: number;
    probesTotal: number;
    latencyMs: number;
    transport: TransportMode;
    corsBlocked: boolean;
    detectedModel: string | null;
    totalUsage: ProbeUsage | null;
    resolvedProvider: VerifyProvider;
    /** Present only when the signature check was requested and could run. */
    signature?: SignatureResult;
    connectivityError: "cors-needs-backend" | "unreachable" | "invalid-key" | "no-format" | null;
};
//# sourceMappingURL=types.d.ts.map