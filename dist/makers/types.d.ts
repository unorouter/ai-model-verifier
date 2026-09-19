/**
 * A maker is who trained a model; a wire is how an endpoint sells it. The
 * vocabulary a genuine model uses for itself belongs to the maker: Claude sold
 * over an OpenAI-shaped relay still says "anthropic", and a DeepSeek over the
 * same wire says "deepseek".
 */
export type Maker<Id extends string = string> = {
    id: Id;
    /** Display name. */
    name: string;
    /** Wire this maker's models are natively sold on; a VendorId for the built-ins. */
    wire: string;
    /** Globs over the normalised model id that name this maker's models. */
    models: readonly string[];
    /** Words a genuine model uses for its maker; matched on word boundaries. */
    home: readonly string[];
    /** Words its model names contain. */
    modelNames: readonly string[];
    /** Model names a cloud host sells under its own badge (Amazon Q over Claude). */
    cloudModelNames?: readonly string[];
    /** A cloud host named as the maker still counts as home (Bedrock is Claude). */
    acceptsCloudHost: boolean;
    /** Tier vocabulary for tier checks; null when the maker sells no tiers. */
    tiers: readonly string[] | null;
    /** Trains primarily on Chinese text: CJK in a reply is a language preference, not a substitution tell. */
    cjkNative: boolean;
};
/** A maker plus the vocabulary derived from every other maker in the registry. */
export type ResolvedMaker<Id extends string = string> = Maker<Id> & {
    /** Words that name a competitor. */
    foreign: readonly string[];
    cloudModelNames: readonly string[];
};
export declare const defineMaker: <const M extends Maker>(maker: M) => M;
//# sourceMappingURL=types.d.ts.map