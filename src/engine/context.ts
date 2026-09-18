import { isRecord } from "../internal/utils";
import type { ModelFacts } from "../models/facts";
import type { TierSignatures } from "../rules/tokenizer-fingerprint";
import type { TransportFn, TransportMode, TransportResult } from "../transport";
import type { Checks, ProbeAttempt } from "../types";
import type {
  BuiltRequest,
  ChatRequest,
  VendorAdapter,
  WireCtx,
} from "../vendors/types";

export type ResolvedChecks = {
  signature: { strict: boolean } | null;
  tokenTruth: boolean;
  thinkingFloor: { minCompletionTokens: number | null } | null;
  tokenizerFingerprint: { signatures: TierSignatures | undefined } | null;
};

export function resolveChecks(checks: Checks | undefined): ResolvedChecks {
  const c = checks ?? {};
  return {
    signature: c.signature
      ? {
          strict:
            typeof c.signature === "object" && c.signature.strict === true,
        }
      : null,
    tokenTruth: c.tokenTruth === true,
    thinkingFloor: c.thinkingFloor
      ? {
          minCompletionTokens:
            typeof c.thinkingFloor === "object"
              ? (c.thinkingFloor.minCompletionTokens ?? null)
              : null,
        }
      : null,
    tokenizerFingerprint: c.tokenizerFingerprint
      ? {
          signatures:
            typeof c.tokenizerFingerprint === "object"
              ? c.tokenizerFingerprint.signatures
              : undefined,
        }
      : null,
  };
}

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

export const wireCtx = (ctx: RunCtx): WireCtx => ({
  baseUrl: ctx.baseUrl,
  apiKey: ctx.apiKey,
  direct: ctx.direct,
  facts: ctx.facts,
});

/** Multipart and binary bodies pass through untouched. */
export function mergeBodyExtras(
  body: unknown,
  extras?: Record<string, unknown>,
): unknown {
  if (!extras || !isRecord(body)) return body;
  return { ...body, ...extras };
}

export function callWire(
  ctx: RunCtx,
  built: BuiltRequest,
): Promise<TransportResult> {
  return ctx.transport({
    mode: ctx.mode,
    url: built.url,
    headers: built.headers,
    reqBody: mergeBodyExtras(built.body, ctx.bodyExtras),
    timeoutMs: ctx.timeoutMs,
  });
}

export const buildChat = (
  ctx: RunCtx,
  req: Omit<ChatRequest, "model">,
): BuiltRequest =>
  ctx.wire.ops.chat({ model: ctx.model, ...req }, wireCtx(ctx));

export const chat = (ctx: RunCtx, req: Omit<ChatRequest, "model">) =>
  callWire(ctx, buildChat(ctx, req));
