import type { SignatureResult } from "./detectors/thinking-signature";
import type { TokenTruthResult } from "./detectors/token-truth";
import type { ThinkingFloorResult } from "./detectors/thinking-floor";
import type { TokenizerFingerprintResult } from "./detectors/tokenizer-fingerprint";
import type { ResponseMetadata } from "./detectors/response-metadata";
import type { ThroughputSample } from "./detectors/throughput";
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
    /** Present only when the token-accounting check was requested. */
    tokenTruth?: TokenTruthResult;
    /** Present only when the thinking-floor check was requested. */
    thinkingFloor?: ThinkingFloorResult;
    /** Present only when the tokenizer fingerprint was requested (Claude only). */
    tokenizerFingerprint?: TokenizerFingerprintResult;
    /** Envelope observations, free: read from responses already collected. */
    responseMetadata?: ResponseMetadata;
    /** Output rate, when a probe generated enough tokens to measure one. */
    throughput?: ThroughputSample | null;
    connectivityError: "cors-needs-backend" | "unreachable" | "invalid-key" | "model-rejected" | "endpoint-busy" | "no-format" | null;
};
//# sourceMappingURL=types.d.ts.map