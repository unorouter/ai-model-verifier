/**
 * Answer fingerprint: the distribution of one-word answers at temperature 1,
 * reported as counts and never judged here. A single run is 24 answers and
 * says nothing; a caller merges runs over days and compares the lane against
 * the profiles it trusts with the helpers below (Jensen-Shannon divergence in
 * bits, the thresholds of arXiv 2607.10252).
 */
import { emptyCell, } from "../engine/answer-fingerprint-runner";
import { defineRule } from "./types";
export const DEFAULT_MATCH_BITS = 0.25;
export const DEFAULT_MISMATCH_BITS = 0.35;
export const DEFAULT_MIN_CELL_SAMPLES = 10;
export const DEFAULT_MIN_CELLS = 4;
export function mergeFingerprints(a, b) {
    const cells = {};
    for (const label of new Set([...Object.keys(a.cells), ...Object.keys(b.cells)])) {
        const x = a.cells[label] ?? emptyCell();
        const y = b.cells[label] ?? emptyCell();
        const answers = { ...x.answers };
        for (const [k, n] of Object.entries(y.answers))
            answers[k] = (answers[k] ?? 0) + n;
        cells[label] = {
            answers,
            valid: x.valid + y.valid,
            refusal: x.refusal + y.refusal,
            invalid: x.invalid + y.invalid,
            empty: x.empty + y.empty,
            errors: x.errors + y.errors,
        };
    }
    return {
        cells,
        calls: a.calls + b.calls,
        temperature: b.temperature,
        detectedModel: b.detectedModel ?? a.detectedModel,
        latencyMs: a.latencyMs + b.latencyMs,
    };
}
const log2 = (x) => Math.log(x) / Math.LN2;
/** Base 2, on two answer histograms; 0 identical, 1 disjoint. */
export function jensenShannon(p, q) {
    const np = Object.values(p).reduce((a, b) => a + b, 0);
    const nq = Object.values(q).reduce((a, b) => a + b, 0);
    if (np === 0 || nq === 0)
        return 1;
    let d = 0;
    for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) {
        const a = (p[k] ?? 0) / np;
        const b = (q[k] ?? 0) / nq;
        const m = (a + b) / 2;
        if (a > 0)
            d += (a / 2) * log2(a / m);
        if (b > 0)
            d += (b / 2) * log2(b / m);
    }
    return Math.min(1, Math.max(0, d));
}
export function compareFingerprints(sample, reference, opts = {}) {
    const minCell = opts.minCellSamples ?? DEFAULT_MIN_CELL_SAMPLES;
    const minCells = opts.minCells ?? DEFAULT_MIN_CELLS;
    const cells = [];
    for (const [label, s] of Object.entries(sample.cells)) {
        const r = reference.cells[label];
        if (!r || s.valid < minCell || r.valid < minCell)
            continue;
        cells.push({
            label,
            jsd: jensenShannon(s.answers, r.answers),
            samples: s.valid,
            refSamples: r.valid,
        });
    }
    if (cells.length < minCells)
        return { jsd: null, cells, verdict: "insufficient" };
    const jsd = cells.reduce((a, c) => a + c.jsd, 0) / cells.length;
    const verdict = jsd <= (opts.matchBits ?? DEFAULT_MATCH_BITS)
        ? "match"
        : jsd > (opts.mismatchBits ?? DEFAULT_MISMATCH_BITS)
            ? "mismatch"
            : "uncertain";
    return { jsd, cells, verdict };
}
/** Best match over a set of accepted profiles (official route, known hosts). */
export function compareToProfiles(sample, profiles, opts = {}) {
    // The closest profile decides: a match to any is known, a mismatch to the
    // closest is a mismatch to all.
    let best = null;
    for (const p of profiles) {
        const r = compareFingerprints(sample, p.sample, opts);
        if (r.jsd === null)
            continue;
        if (!best || r.jsd < best.jsd)
            best = { name: p.name, r, jsd: r.jsd };
    }
    if (!best)
        return { best: null, jsd: null, verdict: "insufficient" };
    const verdict = best.r.verdict === "match"
        ? "known"
        : best.r.verdict === "mismatch"
            ? "novel"
            : "uncertain";
    return { best: best.name, jsd: best.jsd, verdict };
}
/** Greedy clustering by pairwise divergence; largest cluster first. */
export function fingerprintClusters(samples, threshold = DEFAULT_MATCH_BITS, opts = {}) {
    const keys = Object.keys(samples);
    const clusters = [];
    for (const k of keys) {
        const s = samples[k];
        let placed = false;
        for (const c of clusters) {
            const r = compareFingerprints(s, c.pooled, { ...opts, matchBits: threshold });
            if (r.verdict === "match") {
                c.members.push(k);
                c.pooled = mergeFingerprints(c.pooled, s);
                placed = true;
                break;
            }
        }
        if (!placed)
            clusters.push({ members: [k], pooled: s });
    }
    return clusters.sort((a, b) => b.members.length - a.members.length);
}
export const answerFingerprintRule = defineRule({
    id: "answer-fingerprint",
    layer: "note",
    needs: ["answerFingerprint"],
    check: "answerFingerprint",
    applies: () => true,
    judge: async () => null,
    report: async (ctx) => ({
        answerFingerprint: await ctx.evidence("answerFingerprint"),
    }),
});
//# sourceMappingURL=answer-fingerprint.js.map