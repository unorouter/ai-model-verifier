import type { ProbeLabel, ProbeSignal } from "./probes/table";
import type { SurveyLabel } from "./probes/survey";
import type { FingerprintLabel } from "./probes/answer-fingerprint";
import type { Finding, Reports } from "./rules/types";
import type { RuleId } from "./rules/table";
import type { TransportFn, TransportMode } from "./transport";
import type { MakerId } from "./makers/table";
import type { VendorId } from "./vendors/table";
import type { BuiltRequest, ProbeUsage } from "./vendors/types";
import type { TierSignatures } from "./rules/tokenizer-fingerprint";

export type {
  ProbeUsage,
  ProbeLabel,
  ProbeSignal,
  SurveyLabel,
  FingerprintLabel,
  TransportMode,
  VendorId,
  RuleId,
};

export type VerifyVerdict = "genuine" | "suspicious" | "unverified";

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

/** One request of a probe, survey question or fingerprint cell, including the nonce retries; for a caller's own log. */
export type ProbeAttempt = {
  label: ProbeLabel | SurveyLabel | `answer-fingerprint:${FingerprintLabel}`;
  attempt: number;
  pass: boolean;
  signal: ProbeSignal;
  request: BuiltRequest;
  responseText: string | null;
  error?: string;
};

export type Checks = {
  /** Anthropic thinking signature; `strict` replays the block (see the rule). */
  signature?: boolean | { strict?: boolean };
  /** Token accounting: billed deltas for a fixed text, count_tokens agreement. */
  tokenTruth?: boolean;
  /**
   * Reject a must-think model answering with no reasoning tokens. `models`
   * adds id globs to the always-thinks set for this run.
   */
  thinkingFloor?:
    boolean | { models?: readonly string[]; minCompletionTokens?: number };
  /** Input-token delta for a fixed text; `signatures` is a per-endpoint calibration. */
  tokenizerFingerprint?: boolean | { signatures?: TierSignatures };
  /** Ask the survey questions and report the answers; never a verdict. */
  survey?: boolean;
  /** The one-word answer battery at temperature 1, `repeats` per cell (default 3), `concurrency` calls in flight (default 4); never a verdict. */
  answerFingerprint?: boolean | { repeats?: number; concurrency?: number };
};

export type VerifyOptions<V extends string = VendorId> = {
  /** Wire format the endpoint is sold on. */
  vendor: V;
  baseUrl: string;
  apiKey: string;
  model: string;
  mode: TransportMode;
  timeoutMs?: number;
  /** Where requests go; the default is plain fetch, or the proxy in server mode. */
  transport?: TransportFn;
  /** Backend that forwards probes for a browser; required in server mode without a transport. */
  serverProxyUrl?: string;
  /** Top-level fields merged into every JSON request body (a marketplace's seller pin). */
  bodyExtras?: Record<string, unknown>;
  /** Nonce source, injectable so a recorded run replays. */
  nonce?: () => string;
  onProbe?: (attempt: ProbeAttempt) => void;
  checks?: Checks;
};

export type ConnectivityError =
  | "cors-needs-backend"
  | "unreachable"
  | "invalid-key"
  | "model-rejected"
  | "endpoint-busy"
  | "no-format";

export type VerifyResult<
  V extends string = VendorId,
  R extends string = RuleId,
  M extends string = MakerId,
> = Reports & {
  vendor: V;
  /** The tables' maker for the requested model; null when unknown (then the wire's default maker judged it). */
  maker: M | null;
  model: string;
  baseUrlHost: string;
  verdict: VerifyVerdict;
  versionUnverifiable: boolean;
  probes: ProbeOutcome[];
  findings: Finding<R>[];
  reasons: string[];
  probesPassed: number;
  probesTotal: number;
  latencyMs: number;
  transport: TransportMode;
  corsBlocked: boolean;
  detectedModel: string | null;
  totalUsage: ProbeUsage | null;
  /** Wire that answered the handshake; differs from `vendor` after a fallback. */
  resolvedVendor: V;
  connectivityError: ConnectivityError | null;
};

/** Output of `runRules`: judgement on a known wire, no handshake, no verdict. */
export type RuleRun<R extends string = RuleId> = {
  findings: Finding<R>[];
  reports: Reports;
  probes: ProbeOutcome[];
};
