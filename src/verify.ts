import { callWire, resolveChecks, type RunCtx } from "./engine/context";
import { EVIDENCE_ORDER, EvidenceStore } from "./engine/evidence";
import { runHandshake } from "./engine/handshake";
import type { ProbeEval } from "./engine/probe-runner";
import { foldVerdict } from "./engine/verdict";
import { hostOf } from "./internal/utils";
import {
  normalizeModelId,
  resolveModelFacts,
  type FactsEntry,
} from "./models/facts";
import { MAKERS, type MakerId } from "./makers/table";
import { resolveMaker } from "./makers/resolve";
import type { Maker } from "./makers/types";
import { makeNonce } from "./probes/prompts";
import { RULES, type RuleId } from "./rules/table";
import type { Finding, Reports, Rule, RuleCtx } from "./rules/types";
import { browserTransport, directTransport } from "./transport";
import type {
  ConnectivityError,
  ProbeOutcome,
  RuleRun,
  VerifyOptions,
  VerifyResult,
} from "./types";
import { VENDORS, vendorFor, type VendorId } from "./vendors/table";
import type { ProbeUsage, VendorAdapter } from "./vendors/types";

const DEFAULT_TIMEOUT_MS = 30_000;

export type Registry<
  V extends string = VendorId,
  R extends string = RuleId,
  M extends string = MakerId,
> = {
  vendors: readonly VendorAdapter<V>[];
  rules: readonly Rule<R>[];
  facts: readonly FactsEntry<M>[];
  makers: readonly Maker<M>[];
};

export const DEFAULT_REGISTRY: Registry = {
  vendors: VENDORS,
  rules: RULES,
  facts: [],
  makers: MAKERS,
};

function buildCtx<V extends string, M extends string>(
  registry: Registry<V, string, M>,
  opts: VerifyOptions<V>,
): RunCtx<V, M> {
  const wire = vendorFor(registry.vendors, opts.vendor);
  if (!wire) throw new TypeError(`unknown vendor "${opts.vendor}"`);
  const floor = opts.checks?.thinkingFloor;
  const floorModels = typeof floor === "object" ? (floor.models ?? []) : [];
  const facts = resolveModelFacts<M>(
    opts.model,
    [
      ...floorModels.map((p) => ({
        match: `${normalizeModelId(p)}*`,
        alwaysThinks: true,
      })),
      ...registry.facts,
    ],
    registry.makers,
  );
  const transport =
    opts.transport ??
    (opts.mode === "server"
      ? opts.serverProxyUrl
        ? browserTransport({ serverProxyUrl: opts.serverProxyUrl })
        : undefined
      : directTransport);
  if (!transport)
    throw new TypeError("server mode needs a transport or a serverProxyUrl");
  return {
    model: opts.model,
    facts,
    requestedVendor: opts.vendor,
    wire,
    maker: makerOf(registry, facts.maker, wire),
    mode: opts.mode,
    direct: opts.mode === "direct",
    baseUrl: opts.baseUrl,
    apiKey: opts.apiKey,
    timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    transport,
    ...(opts.bodyExtras ? { bodyExtras: opts.bodyExtras } : {}),
    nonce: opts.nonce ?? makeNonce,
    ...(opts.onProbe ? { onProbe: opts.onProbe } : {}),
    checks: resolveChecks(opts.checks),
  };
}

/** The model's own maker, or the wire's default when the tables know no maker. */
function makerOf<M extends string>(
  registry: Registry<string, string, M>,
  maker: M | null,
  wire: VendorAdapter,
) {
  const id = maker ?? wire.defaultMaker;
  if (!maker && !registry.makers.some((m) => m.id === id))
    throw new TypeError(`wire "${wire.id}" names unknown maker "${id}"`);
  return resolveMaker(registry.makers, id as M);
}

type RuleSetRun<R extends string> = {
  findings: Finding<R>[];
  reports: Reports;
  probes: ProbeEval[];
};

/**
 * Collect what the applicable rules need, in canonical order, then judge them
 * in table order so the findings carry their precedence.
 */
async function runRuleSet<R extends string>(
  ctx: RunCtx,
  rules: readonly Rule<R>[],
): Promise<RuleSetRun<R>> {
  const active = rules.filter((r) => r.applies(ctx));
  const needs = new Set(active.flatMap((r) => r.needs));
  const store = new EvidenceStore(ctx);
  for (const key of EVIDENCE_ORDER) if (needs.has(key)) await store.get(key);
  const rctx: RuleCtx = { ...ctx, evidence: (key) => store.get(key) };

  const findings: Finding<R>[] = [];
  const reports: Reports = {};
  for (const rule of active) {
    const verdict = await rule.judge(rctx);
    if (verdict)
      findings.push({ ...verdict, rule: rule.id, layer: rule.layer });
    if (rule.report) Object.assign(reports, await rule.report(rctx));
  }
  return {
    findings,
    reports,
    probes: needs.has("probes") ? await store.get("probes") : [],
  };
}

const publicProbe = (p: ProbeEval): ProbeOutcome => ({
  label: p.label,
  pass: p.pass,
  signal: p.signal,
  muxFailure: p.muxFailure,
  transient: p.transient,
  latencyMs: p.latencyMs,
  prompt: p.prompt,
  responseText: p.responseText,
  httpStatus: p.httpStatus,
  usage: p.usage,
  detectedModel: p.detectedModel,
  reason: p.reason,
});

function sumUsage(usages: (ProbeUsage | null)[]): ProbeUsage | null {
  const present = usages.filter((u): u is ProbeUsage => u !== null);
  if (present.length === 0) return null;
  const add = (key: keyof ProbeUsage) => {
    const vals = present
      .map((u) => u[key])
      .filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;
  };
  return {
    prompt: add("prompt"),
    completion: add("completion"),
    total: add("total"),
  };
}

function connectivityResult<V extends string, R extends string, M extends string>(
  opts: VerifyOptions<V>,
  maker: M | null,
  error: ConnectivityError,
  corsBlocked: boolean,
  startedAt: number,
): VerifyResult<V, R, M> {
  return {
    vendor: opts.vendor,
    maker,
    model: opts.model,
    baseUrlHost: hostOf(opts.baseUrl),
    verdict: "unverified",
    versionUnverifiable: false,
    probes: [],
    findings: [],
    reasons: [error],
    probesPassed: 0,
    probesTotal: 0,
    latencyMs: Math.round(performance.now() - startedAt),
    transport: opts.mode,
    corsBlocked,
    detectedModel: null,
    totalUsage: null,
    resolvedVendor: opts.vendor,
    connectivityError: error,
  };
}

/** Handshake, probes, every enabled rule, verdict. */
export async function verifyWith<
  V extends string,
  R extends string,
  M extends string = MakerId,
>(
  registry: Registry<V, R, M>,
  opts: VerifyOptions<V>,
): Promise<VerifyResult<V, R, M>> {
  const started = performance.now();
  const requested = buildCtx(registry, opts);
  const hs = await runHandshake(requested, registry.vendors);
  if (!hs.ok)
    return connectivityResult(
      opts,
      requested.facts.maker,
      hs.reason,
      hs.corsBlocked,
      started,
    );
  const ctx: RunCtx<V, M> = {
    ...requested,
    wire: hs.wire,
    maker: makerOf(registry, requested.facts.maker, hs.wire),
  };

  const rules = registry.rules.filter((r) => !r.check || ctx.checks[r.check]);
  const run = await runRuleSet(ctx, rules);
  const folded = foldVerdict(run.findings);
  const probes = run.probes.map(publicProbe);

  return {
    ...run.reports,
    vendor: opts.vendor,
    maker: requested.facts.maker,
    model: opts.model,
    baseUrlHost: hostOf(opts.baseUrl),
    verdict: folded.verdict,
    versionUnverifiable: folded.versionUnverifiable,
    probes,
    findings: run.findings,
    reasons: folded.reasons,
    probesPassed: probes.filter((p) => p.pass).length,
    probesTotal: probes.length,
    latencyMs: Math.round(performance.now() - started),
    transport: ctx.mode,
    corsBlocked: ctx.direct && run.probes.some((p) => p.corsBlocked),
    detectedModel: probes.find((p) => p.detectedModel)?.detectedModel ?? null,
    totalUsage: sumUsage(probes.map((p) => p.usage)),
    resolvedVendor: hs.wire.id,
    connectivityError: null,
  };
}

/**
 * Judge chosen rules on a wire the caller already knows works: no handshake,
 * no verdict, only the evidence those rules ask for. A rule named here runs
 * whether or not its `checks` switch is on; `checks` still carries options.
 */
export async function runRulesWith<
  V extends string,
  R extends string,
  M extends string = MakerId,
>(
  registry: Registry<V, R, M>,
  opts: VerifyOptions<V> & { only: readonly R[] },
): Promise<RuleRun<R>> {
  const ctx = buildCtx(registry, opts);
  const wanted = new Set<string>(opts.only);
  const run = await runRuleSet(
    ctx,
    registry.rules.filter((r) => wanted.has(r.id)),
  );
  return {
    findings: run.findings,
    reports: run.reports,
    probes: run.probes.map(publicProbe),
  };
}

export const verify = (opts: VerifyOptions) =>
  verifyWith(DEFAULT_REGISTRY, opts);

export const runRules = (opts: VerifyOptions & { only: readonly RuleId[] }) =>
  runRulesWith(DEFAULT_REGISTRY, opts);

/** One raw request through the run's transport and body extras, for callers with their own probes. */
export { callWire };
