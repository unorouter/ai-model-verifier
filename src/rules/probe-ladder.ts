/**
 * The behavioural ladder over the four probes, one rule per rung, in the order
 * the table lists them. Each rule reads every probe's outcome, which is why the
 * probes are data and the rules are here.
 */

import type { ProbeEval } from "../engine/probe-runner";
import type { ProbeSignal } from "../probes/table";
import { detectSubstitution } from "../models/substitution";
import { detectServedModelMismatch, detectTierMismatch } from "../models/tiers";
import { defineRule } from "./types";

const QUORUM = 3;

const labelsWith = (probes: readonly ProbeEval[], sig: ProbeSignal) =>
  probes
    .filter((r) => r.signal === sig)
    .map((r) => r.label)
    .join(", ");

const signalRule = <const Id extends string>(
  id: Id,
  signal: ProbeSignal,
  prefix: string,
) =>
  defineRule({
    id,
    layer: "probe",
    needs: ["probes"],
    applies: () => true,
    judge: async (ctx) => {
      const labels = labelsWith(await ctx.evidence("probes"), signal);
      return labels
        ? { severity: "fail", reason: `${prefix}: ${labels}` }
        : null;
    },
  });

export const codingToolRule = signalRule(
  "coding-tool",
  "coding-tool",
  "coding-tool-refusal",
);
export const scamRule = signalRule("scam", "scam", "scam-page");
export const cjkLeakRule = signalRule(
  "cjk-leak",
  "cjk-leak",
  "cjk-language-leak",
);

/** Two probes whose reply never carried their nonce: the proxy mixes responses. */
export const muxRule = defineRule({
  id: "mux",
  layer: "probe",
  needs: ["probes"],
  applies: () => true,
  judge: async (ctx) => {
    const labels = (await ctx.evidence("probes"))
      .filter((r) => r.muxFailure)
      .map((r) => r.label);
    return labels.length >= 2
      ? {
          severity: "fail",
          reason: `unsafe-proxy: response-mixing on ${labels.join(", ")}`,
        }
      : null;
  },
});

/**
 * A foreign vendor on EITHER identity probe is a hard fail: a real model never
 * names a competitor as its maker. The reason lists every foreign probe.
 */
export const foreignRule = defineRule({
  id: "foreign",
  layer: "probe",
  needs: ["probes"],
  applies: () => true,
  judge: async (ctx) => {
    const probes = await ctx.evidence("probes");
    const onIdentity = probes.some(
      (r) =>
        r.signal === "foreign" &&
        (r.label === "model-name" || r.label === "identity"),
    );
    return onIdentity
      ? {
          severity: "fail",
          reason: `foreign-identity: ${labelsWith(probes, "foreign")}`,
        }
      : null;
  },
});

/** The reply's own `model` field names another tier than the one requested. */
export const servedModelMismatchRule = defineRule({
  id: "served-model-mismatch",
  layer: "probe",
  needs: ["probes"],
  applies: (ctx) => ctx.tiers !== null,
  judge: async (ctx) => {
    const probes = await ctx.evidence("probes");
    const served = detectServedModelMismatch(
      ctx.model,
      probes.map((r) => r.detectedModel),
      ctx.tiers ?? [],
    );
    return served
      ? {
          severity: "fail",
          reason: `served-model-mismatch: requested ${ctx.model}, response model ${served}`,
          data: { served },
        }
      : null;
  },
});

/** The reply's `model` field is not the requested model at all (lenient spelling). */
export const substitutedRule = defineRule({
  id: "substituted",
  layer: "probe",
  needs: ["probes"],
  applies: () => true,
  judge: async (ctx) => {
    const probes = await ctx.evidence("probes");
    const detected = probes.find((r) => r.detectedModel)?.detectedModel ?? null;
    const served = detectSubstitution(ctx.model, detected);
    return served
      ? { severity: "fail", reason: `substituted:${served}`, data: { served } }
      : null;
  },
});

/**
 * Past the hard signals, the remaining failures are quality or transport. A
 * shortfall driven only by transient upstream errors is inconclusive: a real
 * lane that got rate limited mid-probe stays eligible and is probed again.
 */
export const quorumRule = defineRule({
  id: "quorum",
  layer: "probe",
  needs: ["probes"],
  applies: () => true,
  judge: async (ctx) => {
    const probes = await ctx.evidence("probes");
    const failed = probes.filter((r) => !r.pass);
    if (probes.length - failed.length >= QUORUM) return null;
    const labels = failed.map((r) => r.label).join(", ");
    const transientFails = failed.filter((r) => r.transient).length;
    const nonTransientFails = failed.filter(
      (r) => !r.transient && r.signal !== null,
    ).length;
    if (transientFails > 0 && nonTransientFails === 0)
      return { severity: "inconclusive", reason: `transient: ${labels}` };
    const blank = failed.filter((r) => r.signal === "blank").length;
    if (blank === failed.length)
      return { severity: "suspect", reason: `blank-response: ${labels}` };
    const mux = failed.filter((r) => r.muxFailure).map((r) => r.label);
    if (mux.length > 0)
      return {
        severity: "suspect",
        reason: `unsafe-proxy: response-mixing on ${mux.join(", ")} (with ${labels} failing)`,
      };
    return { severity: "suspect", reason: `failed: ${labels}` };
  },
});

/**
 * What the model calls itself is coachable and unstable: a kiro pool's system
 * prompt makes a real opus-4-6 answer "Claude 3.7 Sonnet" on one probe and
 * refuse on the next. Logged only; the reply's model field and the tokenizer
 * fingerprint are the evidence that fails a lane.
 */
export const tierSelfReportRule = defineRule({
  id: "tier-self-report",
  layer: "note",
  needs: ["probes"],
  applies: (ctx) => ctx.tiers !== null,
  judge: async (ctx) => {
    const probes = await ctx.evidence("probes");
    const claimed = detectTierMismatch(
      ctx.model,
      probes.find((r) => r.label === "model-name")?.text,
      ctx.tiers ?? [],
    );
    return claimed
      ? {
          severity: "note",
          reason: `tier-self-report: claims ${claimed}`,
          data: { claimed },
        }
      : null;
  },
});
