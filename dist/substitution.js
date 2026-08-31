/**
 * Envelope-level model substitution: the endpoint answers with a different
 * model id than the one requested.
 *
 * This catches the fraud that every behavioural probe passes, because the reply
 * genuinely IS the vendor's model, just a cheaper one than billed for. It costs
 * nothing: the id is already in the response every probe makes.
 */
/**
 * Ported from new-api-sync (`core/testing/runner.ts`), where the leniency is
 * load-bearing. A strict comparison once condemned an honest upstream and cost
 * it all ten of its Claude models, so this tolerates the three ways vendors
 * legitimately spell the same model:
 *   - separator drift        claude-opus-4.8   vs claude-opus-4-8
 *   - vendor-qualified ids   anthropic/claude-opus-5 vs claude-opus-5
 *   - dated snapshots        claude-haiku-4-5  vs claude-haiku-4-5-20251001
 */
export function modelsMatch(requested, served) {
    const norm = (s) => s.toLowerCase().replace(/[.]/g, "-").split("/").pop() ?? "";
    const a = norm(requested);
    const b = norm(served);
    if (!a || !b)
        return true;
    return a === b || a.startsWith(b) || b.startsWith(a);
}
/**
 * The served id when it contradicts the request, else null. A missing id is not
 * evidence: plenty of honest relays omit it.
 */
export function detectSubstitution(requested, detectedModel) {
    if (!detectedModel)
        return null;
    return modelsMatch(requested, detectedModel) ? null : detectedModel;
}
//# sourceMappingURL=substitution.js.map