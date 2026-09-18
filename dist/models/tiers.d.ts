/** The one tier a text names, or null when it names none or hedges ("opus or sonnet"). */
export declare function tierOf(text: string, tiers: readonly string[]): string | null;
/**
 * The tier the model-name reply claims when it contradicts the requested one.
 * What a model calls itself is coachable, so callers treat this as a note.
 */
export declare function detectTierMismatch(requestedModel: string, modelNameText: string | undefined, tiers: readonly string[]): string | null;
/**
 * The served model id when the reply's own `model` field names another tier: a
 * relay that maps the requested name to a cheaper backend reports it here while
 * every behavioural probe passes.
 */
export declare function detectServedModelMismatch(requestedModel: string, servedModels: readonly (string | null)[], tiers: readonly string[]): string | null;
//# sourceMappingURL=tiers.d.ts.map