import type { ModelFacts } from "../models/facts";
import type { TierSignatures } from "../rules/tokenizer-fingerprint";
import type { TransportFn, TransportMode, TransportResult } from "../transport";
import type { Checks, ProbeAttempt } from "../types";
import type { BuiltRequest, ChatRequest, VendorAdapter, WireCtx } from "../vendors/types";
export type ResolvedChecks = {
    signature: {
        strict: boolean;
    } | null;
    tokenTruth: boolean;
    thinkingFloor: {
        minCompletionTokens: number | null;
    } | null;
    tokenizerFingerprint: {
        signatures: TierSignatures | undefined;
    } | null;
};
export declare function resolveChecks(checks: Checks | undefined): ResolvedChecks;
/** Everything a rule may read about the run. */
export type RunCtx<V extends string = string> = {
    model: string;
    facts: ModelFacts;
    requestedVendor: V;
    /** Wire the requests go over (after a handshake fallback, not the requested one). */
    wire: VendorAdapter<V>;
    mode: TransportMode;
    direct: boolean;
    baseUrl: string;
    apiKey: string;
    timeoutMs: number;
    transport: TransportFn;
    bodyExtras?: Record<string, unknown>;
    nonce: () => string;
    onProbe?: (attempt: ProbeAttempt) => void;
    checks: ResolvedChecks;
};
export declare const wireCtx: (ctx: RunCtx) => WireCtx;
/** Multipart and binary bodies pass through untouched. */
export declare function mergeBodyExtras(body: unknown, extras?: Record<string, unknown>): unknown;
export declare function callWire(ctx: RunCtx, built: BuiltRequest): Promise<TransportResult>;
export declare const buildChat: (ctx: RunCtx, req: Omit<ChatRequest, "model">) => BuiltRequest;
export declare const chat: (ctx: RunCtx, req: Omit<ChatRequest, "model">) => Promise<TransportResult>;
//# sourceMappingURL=context.d.ts.map