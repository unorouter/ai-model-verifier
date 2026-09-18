// Root export: the engine, the tables and every type. Vendors, rules, models,
// transport and highlight have their own entry points for consumers that only
// want a piece.
export * from "./types";
export { verify, runRules, verifyWith, runRulesWith, callWire } from "./verify";
export type { Registry } from "./verify";
export { createVerifier } from "./registry";
export { defineVendor } from "./vendors/types";
export type {
  VendorAdapter,
  VendorIdentity,
  WireCtx,
  ChatRequest,
  ChatMessage,
  CountRequest,
  BuiltRequest,
  ProbeMeta,
  EnvelopeShape,
} from "./vendors/types";
export { VENDORS, vendorFor } from "./vendors/table";
export { defineRule } from "./rules/types";
export type {
  Rule,
  RuleCtx,
  RuleLayer,
  RuleVerdict,
  Finding,
  Severity,
  Reports,
} from "./rules/types";
export {
  RULES,
  DETECTION_RULES,
  DETECTION_EXCEPTIONS,
  RULE_FOR_SIGNAL,
} from "./rules/table";
export type { VerdictRuleId, DetectionExceptionId } from "./rules/table";
export type { EvidenceBag, EvidenceKey } from "./engine/evidence";
export { defineModelFacts, resolveModelFacts } from "./models/facts";
export type { ModelFacts, FactsEntry } from "./models/facts";
export { PROBES, PROBE_SIGNALS } from "./probes/table";
export type { TransportFn, TransportArgs, TransportResult } from "./transport";
export { directTransport, browserTransport } from "./transport";
