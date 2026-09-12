// Root export: types, the runner and the rule registry. Providers and detectors
// have their own entry points so a consumer only bundles what it enables.
export * from "./types";
export * from "./rules";
export { runVerification } from "./runner";
export { normalizeProbeBaseUrl } from "./providers/config";
export type {
  ProviderConfig,
  ProbeRequestArgs,
  BuiltRequest,
  ProbeMeta,
} from "./providers/config";
export type { TransportFn, TransportArgs, TransportResult } from "./transport";
export type {
  TokenizerFingerprintResult,
  TierSignatures,
} from "./detectors/tokenizer-fingerprint";
