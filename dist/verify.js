import { callWire, resolveChecks } from "./engine/context";
import { EVIDENCE_ORDER, EvidenceStore } from "./engine/evidence";
import { runHandshake } from "./engine/handshake";
import { foldVerdict } from "./engine/verdict";
import { hostOf } from "./internal/utils";
import { normalizeModelId, resolveModelFacts, } from "./models/facts";
import { makeNonce } from "./probes/prompts";
import { RULES } from "./rules/table";
import { browserTransport, directTransport } from "./transport";
import { VENDORS, vendorFor } from "./vendors/table";
const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_REGISTRY = {
    vendors: VENDORS,
    rules: RULES,
    facts: [],
};
function buildCtx(registry, opts) {
    const wire = vendorFor(registry.vendors, opts.vendor);
    if (!wire)
        throw new TypeError(`unknown vendor "${opts.vendor}"`);
    const floor = opts.checks?.thinkingFloor;
    const floorModels = typeof floor === "object" ? (floor.models ?? []) : [];
    const facts = resolveModelFacts(opts.model, [
        ...floorModels.map((p) => ({
            match: `${normalizeModelId(p)}*`,
            alwaysThinks: true,
        })),
        ...registry.facts,
    ]);
    const transport = opts.transport ??
        (opts.mode === "server"
            ? opts.serverProxyUrl
                ? browserTransport({ serverProxyUrl: opts.serverProxyUrl })
                : undefined
            : directTransport);
    if (!transport)
        throw new TypeError("server mode needs a transport or a serverProxyUrl");
    const home = facts.vendor
        ? vendorFor(registry.vendors, facts.vendor)
        : undefined;
    return {
        model: opts.model,
        facts,
        requestedVendor: opts.vendor,
        wire,
        identity: (home ?? wire).identity,
        tiers: (home ?? wire).tiers,
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
/**
 * Collect what the applicable rules need, in canonical order, then judge them
 * in table order so the findings carry their precedence.
 */
async function runRuleSet(ctx, rules) {
    const active = rules.filter((r) => r.applies(ctx));
    const needs = new Set(active.flatMap((r) => r.needs));
    const store = new EvidenceStore(ctx);
    for (const key of EVIDENCE_ORDER)
        if (needs.has(key))
            await store.get(key);
    const rctx = { ...ctx, evidence: (key) => store.get(key) };
    const findings = [];
    const reports = {};
    for (const rule of active) {
        const verdict = await rule.judge(rctx);
        if (verdict)
            findings.push({ ...verdict, rule: rule.id, layer: rule.layer });
        if (rule.report)
            Object.assign(reports, await rule.report(rctx));
    }
    return {
        findings,
        reports,
        probes: needs.has("probes") ? await store.get("probes") : [],
    };
}
const publicProbe = (p) => ({
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
function sumUsage(usages) {
    const present = usages.filter((u) => u !== null);
    if (present.length === 0)
        return null;
    const add = (key) => {
        const vals = present
            .map((u) => u[key])
            .filter((v) => v !== null);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;
    };
    return {
        prompt: add("prompt"),
        completion: add("completion"),
        total: add("total"),
    };
}
function connectivityResult(opts, error, corsBlocked, startedAt) {
    return {
        vendor: opts.vendor,
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
export async function verifyWith(registry, opts) {
    const started = performance.now();
    const requested = buildCtx(registry, opts);
    const hs = await runHandshake(requested, registry.vendors);
    if (!hs.ok)
        return connectivityResult(opts, hs.reason, hs.corsBlocked, started);
    const home = requested.facts.vendor !== null;
    const ctx = {
        ...requested,
        wire: hs.wire,
        identity: home ? requested.identity : hs.wire.identity,
        tiers: home ? requested.tiers : hs.wire.tiers,
    };
    const rules = registry.rules.filter((r) => !r.check || ctx.checks[r.check]);
    const run = await runRuleSet(ctx, rules);
    const folded = foldVerdict(run.findings);
    const probes = run.probes.map(publicProbe);
    return {
        ...run.reports,
        vendor: opts.vendor,
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
export async function runRulesWith(registry, opts) {
    const ctx = buildCtx(registry, opts);
    const wanted = new Set(opts.only);
    const run = await runRuleSet(ctx, registry.rules.filter((r) => wanted.has(r.id)));
    return {
        findings: run.findings,
        reports: run.reports,
        probes: run.probes.map(publicProbe),
    };
}
export const verify = (opts) => verifyWith(DEFAULT_REGISTRY, opts);
export const runRules = (opts) => runRulesWith(DEFAULT_REGISTRY, opts);
/** One raw request through the run's transport and body extras, for callers with their own probes. */
export { callWire };
//# sourceMappingURL=verify.js.map