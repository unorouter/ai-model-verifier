import type { ModelFacts } from "../models/facts";
import type { TierSignatures } from "../rules/tokenizer-fingerprint";
import type { TransportFn, TransportMode, TransportResult } from "../transport";
import type { Checks, ProbeAttempt } from "../types";
import type { ResolvedMaker } from "../makers/types";
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
export type RunCtx<V extends string = string, M extends string = string> = {
    model: string;
    facts: ModelFacts<M>;
    requestedVendor: V;
    /** Wire the requests go over (after a handshake fallback, not the requested one). */
    wire: VendorAdapter<V>;
    /**
     * The model's own maker, not the wire's: Claude sold over an OpenAI-shaped
     * relay still calls its maker "anthropic". Falls back to the wire's default
     * maker when the model id names no maker the tables know.
     */
    maker: ResolvedMaker<M>;
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