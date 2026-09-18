/**
 * Findings arrive in rule-table order, so the first one that is not a note
 * decides. An evidence-layer finding therefore outranks the probe ladder, and
 * within the ladder the earlier rule wins, exactly the old hand-ordered chain.
 */
export function foldVerdict(findings) {
    const first = findings.find((f) => f.severity !== "note");
    const verdict = !first
        ? "genuine"
        : first.severity === "inconclusive"
            ? "unverified"
            : "suspicious";
    return {
        verdict,
        reasons: first ? [first.reason] : [],
        versionUnverifiable: !findings.some((f) => f.layer === "probe" && f.severity !== "note"),
    };
}
//# sourceMappingURL=verdict.js.map