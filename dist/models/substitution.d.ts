/**
 * Envelope-level model substitution: the endpoint answers with a different
 * model id than the one requested.
 *
 * This catches the fraud that every behavioural probe passes, because the reply
 * genuinely IS the vendor's model, just a cheaper one than billed for. It costs
 * nothing: the id is already in the response every probe makes.
 */
/**
 * A strict comparison once condemned an honest upstream and cost it all ten of
 * its Claude models, so this tolerates the ways vendors legitimately spell the
 * same model:
 *   - separator drift        claude-opus-4.8   vs claude-opus-4-8
 *   - vendor-qualified ids   anthropic/claude-opus-5 vs claude-opus-5
 *   - dated snapshots        claude-haiku-4-5  vs claude-haiku-4-5-20251001
 *   - relay route tags       [free]deepseek-v4.1-flash vs deepseek-ai/deepseek-v4.1-flash
 *   - Kimi without its k     kimi-k2.7-code    vs kimi-2.7 (seven a7 lanes echo it)
 */
export declare function modelsMatch(requested: string, served: string): boolean;
/**
 * The served id when it contradicts the request, else null. A missing id is not
 * evidence: plenty of honest relays omit it.
 */
export declare function detectSubstitution(requested: string, detectedModel: string | null | undefined): string | null;
//# sourceMappingURL=substitution.d.ts.map