/** The one tier a text names, or null when it names none or hedges ("opus or sonnet"). */
export function tierOf(text, tiers) {
    const found = tiers.filter((tier) => text.includes(tier));
    return found.length === 1 ? found[0] : null;
}
/**
 * The tier the model-name reply claims when it contradicts the requested one.
 * What a model calls itself is coachable, so callers treat this as a note.
 */
export function detectTierMismatch(requestedModel, modelNameText, tiers) {
    const reqTier = tierOf(requestedModel.toLowerCase(), tiers);
    if (!reqTier || !modelNameText)
        return null;
    const saidTier = tierOf(modelNameText, tiers);
    return saidTier && saidTier !== reqTier ? saidTier : null;
}
/**
 * The served model id when the reply's own `model` field names another tier: a
 * relay that maps the requested name to a cheaper backend reports it here while
 * every behavioural probe passes.
 */
export function detectServedModelMismatch(requestedModel, servedModels, tiers) {
    const reqTier = tierOf(requestedModel.toLowerCase(), tiers);
    if (!reqTier)
        return null;
    for (const served of servedModels) {
        if (!served)
            continue;
        const tier = tierOf(served.toLowerCase(), tiers);
        if (tier && tier !== reqTier)
            return served.toLowerCase();
    }
    return null;
}
//# sourceMappingURL=tiers.js.map