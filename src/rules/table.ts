import type { ProbeSignal } from "../probes/table";
import {
  cjkLeakRule,
  codingToolRule,
  foreignRule,
  muxRule,
  quorumRule,
  scamRule,
  servedModelMismatchRule,
  substitutedRule,
  tierSelfReportRule,
} from "./probe-ladder";
import { envelopeRule } from "./response-metadata";
import { signatureRule } from "./thinking-signature";
import { surveyRule } from "./survey";
import { answerFingerprintRule } from "./answer-fingerprint";
import { thinkLeakRule } from "./think-leak";
import { wrapperLeakRule } from "./wrapper-leak";
import { thinkingFloorRule } from "./thinking-floor";
import { throughputRule } from "./throughput";
import { tokenTruthRule } from "./token-truth";
import { tokenizerFingerprintRule } from "./tokenizer-fingerprint";
import type { Rule } from "./types";

/**
 * Precedence is this order: the first finding that is not a note decides the
 * verdict. Evidence rules sit above the probe ladder because they read facts a
 * coached reply cannot fake; note rules only report.
 */
export const RULES = [
  thinkingFloorRule,
  tokenizerFingerprintRule,
  codingToolRule,
  scamRule,
  cjkLeakRule,
  muxRule,
  foreignRule,
  servedModelMismatchRule,
  substitutedRule,
  quorumRule,
  tierSelfReportRule,
  signatureRule,
  tokenTruthRule,
  envelopeRule,
  throughputRule,
  thinkLeakRule,
  wrapperLeakRule,
  surveyRule,
  answerFingerprintRule,
] as const satisfies readonly Rule[];

type RuleEntry = (typeof RULES)[number];
export type RuleId = RuleEntry["id"];
/** Rules that can decide a verdict; a UI naming every rule keys off this. */
export type VerdictRuleId = Extract<
  RuleEntry,
  { layer: "evidence" | "probe" }
>["id"];

export const DETECTION_RULES: readonly VerdictRuleId[] = RULES.filter(
  (r): r is Extract<RuleEntry, { layer: "evidence" | "probe" }> =>
    r.layer !== "note",
).map((r) => r.id);

export const DETECTION_EXCEPTIONS = [
  "version",
  "transient",
  "cloud-host",
  "reshaping",
  "threshold",
] as const;
export type DetectionExceptionId = (typeof DETECTION_EXCEPTIONS)[number];

/** The rule a probe's signal feeds, for linking a probe row to a rule. */
export const RULE_FOR_SIGNAL = {
  "coding-tool": "coding-tool",
  scam: "scam",
  "cjk-leak": "cjk-leak",
  foreign: "foreign",
  "cloud-host": null,
  blank: "quorum",
} as const satisfies Record<NonNullable<ProbeSignal>, VerdictRuleId | null>;
