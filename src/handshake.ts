import { PROVIDER_CONFIGS } from "./providers/config";
import { probeTransport, type TransportFn } from "./transport";
import { isTransientError } from "./signals";
import type { TransportMode, VerifyProvider } from "./types";

export type HandshakeOutcome =
  | {
      ok: true;
      resolvedProvider: VerifyProvider;
      mode: TransportMode;
      status: number;
    }
  | {
      ok: false;
      reason:
        | "cors-needs-backend"
        | "unreachable"
        | "invalid-key"
        | "model-rejected"
        | "endpoint-busy"
        | "no-format";
      status: number | null;
      corsBlocked: boolean;
    };

const HANDSHAKE_PROMPT = "hi";
const HANDSHAKE_MAX_TOKENS = 1;

function classifyStatus(
  status: number,
): "ok" | "auth" | "format" | "transient" {
  if (status >= 200 && status < 300) return "ok";
  if (status === 401 || status === 403) return "auth";
  if (isTransientError(`HTTP ${status}`)) return "transient";
  if (status >= 400 && status < 500) return "format";
  return "transient";
}

// An error body naming the model (OpenAI's `model_not_found`, and the same
// shape from every gateway that copies it) means the endpoint understood the
// request and rejected the MODEL. Reporting that as a format failure sends
// people looking for a protocol bug when they only mistyped a model name.
const MODEL_ERROR_CODES = [
  "model_not_found",
  "model_not_supported",
  "invalid_model",
  "unknown_model",
];

function rejectsModel(data: unknown): boolean {
  const err = (data as { error?: unknown } | null)?.error;
  if (typeof err !== "object" || err === null) return false;
  const fields = err as { code?: unknown; type?: unknown; message?: unknown };
  const code = typeof fields.code === "string" ? fields.code.toLowerCase() : "";
  const type = typeof fields.type === "string" ? fields.type.toLowerCase() : "";
  if (MODEL_ERROR_CODES.includes(code) || MODEL_ERROR_CODES.includes(type))
    return true;
  const msg =
    typeof fields.message === "string" ? fields.message.toLowerCase() : "";
  return (
    msg.includes("model") &&
    (msg.includes("not found") ||
      msg.includes("not offered") ||
      msg.includes("not supported") ||
      msg.includes("does not exist"))
  );
}

async function tryFormat(args: {
  provider: VerifyProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  mode: TransportMode;
  timeoutMs: number;
  transport: TransportFn;
}): Promise<{
  outcome: "ok" | "auth" | "format" | "transient" | "cors" | "model";
  status: number | null;
  corsBlocked: boolean;
}> {
  const cfg = PROVIDER_CONFIGS[args.provider];
  const built = cfg.buildRequest({
    baseUrl: args.baseUrl,
    apiKey: args.apiKey,
    model: args.model,
    prompt: HANDSHAKE_PROMPT,
    maxTokens: HANDSHAKE_MAX_TOKENS,
    direct: args.mode === "direct",
  });
  const res = await args.transport({
    mode: args.mode,
    url: built.url,
    headers: built.headers,
    reqBody: built.body,
    timeoutMs: args.timeoutMs,
  });

  if (res.corsBlocked)
    return { outcome: "cors", status: null, corsBlocked: true };
  if (res.status === null)
    return { outcome: "transient", status: null, corsBlocked: false };
  const outcome = classifyStatus(res.status);
  return {
    outcome: outcome !== "ok" && rejectsModel(res.data) ? "model" : outcome,
    status: res.status,
    corsBlocked: false,
  };
}

export async function runHandshake(opts: {
  provider: VerifyProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  mode: TransportMode;
  timeoutMs: number;
  transport?: TransportFn;
}): Promise<HandshakeOutcome> {
  const transport = opts.transport ?? probeTransport;
  const order: VerifyProvider[] =
    opts.provider === "openai" ? ["openai"] : [opts.provider, "openai"];

  let sawAuth = false;
  let sawModelRejected = false;
  let sawTransient = false;
  let lastStatus: number | null = null;

  for (const provider of order) {
    const r = await tryFormat({ ...opts, provider, transport });
    lastStatus = r.status;

    if (r.outcome === "cors")
      return {
        ok: false,
        reason: "cors-needs-backend",
        status: null,
        corsBlocked: true,
      };
    if (r.outcome === "ok")
      return {
        ok: true,
        resolvedProvider: provider,
        mode: opts.mode,
        status: r.status!,
      };
    if (r.outcome === "auth") sawAuth = true;
    if (r.outcome === "model") sawModelRejected = true;
    if (r.outcome === "transient") sawTransient = true;
  }

  // Before the key check: a gateway that rejects the model name often answers
  // 403 on the second format too, which would otherwise read as a bad key.
  if (sawModelRejected)
    return {
      ok: false,
      reason: "model-rejected",
      status: lastStatus,
      corsBlocked: false,
    };
  if (sawAuth)
    return {
      ok: false,
      reason: "invalid-key",
      status: lastStatus,
      corsBlocked: false,
    };
  if (lastStatus === null)
    return {
      ok: false,
      reason: "unreachable",
      status: null,
      corsBlocked: false,
    };
  // Every format answered 429/5xx: the endpoint is having a bad moment, which
  // is never evidence that it speaks no supported format.
  if (sawTransient)
    return {
      ok: false,
      reason: "endpoint-busy",
      status: lastStatus,
      corsBlocked: false,
    };
  return {
    ok: false,
    reason: "no-format",
    status: lastStatus,
    corsBlocked: false,
  };
}
