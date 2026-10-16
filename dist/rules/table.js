import { cjkLeakRule, codingToolRule, foreignRule, muxRule, quorumRule, scamRule, servedModelMismatchRule, substitutedRule, tierSelfReportRule, } from "./probe-ladder";
import { envelopeRule } from "./response-metadata";
import { signatureRule } from "./thinking-signature";
import { surveyRule } from "./survey";
import { answerFingerprintRule } from "./answer-fingerprint";
import { thinkLeakRule } from "./think-leak";
import { maskedIdentityRule } from "./masked-identity";
import { maskContradictionRule } from "./mask-contradiction";
import { fake200Rule } from "./fake-200";
import { wrapperLeakRule } from "./wrapper-leak";
import { thinkingFloorRule } from "./thinking-floor";
import { thinkingHonoredRule } from "./thinking-honored";
import { throughputRule } from "./throughput";
import { tokenTruthRule } from "./token-truth";
import { tokenizerFingerprintRule } from "./tokenizer-fingerprint";
import { tokenizerFamilyRule } from "./tokenizer-family";
/**
 * Precedence is this order: the first finding that is not a note decides the
 * verdict. Evidence rules sit above the probe ladder because they read facts a
 * coached reply cannot fake; note rules only report.
 */
export const RULES = [
    thinkingFloorRule,
    thinkingHonoredRule,
    tokenizerFingerprintRule,
    tokenizerFamilyRule,
    maskedIdentityRule,
    fake200Rule,
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
    maskContradictionRule,
    surveyRule,
    answerFingerprintRule,
];
export const DETECTION_RULES = RULES.filter((r) => r.layer !== "note").map((r) => r.id);
export const DETECTION_EXCEPTIONS = [
    "version",
    "transient",
    "cloud-host",
    "reshaping",
    "threshold",
];
/** The rule a probe's signal feeds, for linking a probe row to a rule. */
export const RULE_FOR_SIGNAL = {
    "coding-tool": "coding-tool",
    scam: "scam",
    "cjk-leak": "cjk-leak",
    foreign: "foreign",
    "cloud-host": null,
    blank: "quorum",
};
//# sourceMappingURL=table.js.map