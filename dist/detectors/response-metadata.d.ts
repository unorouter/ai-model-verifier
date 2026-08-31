/**
 * Passive response metadata: what the envelope reveals about who really
 * answered, read from responses the run already made.
 *
 * Costs nothing (no extra requests) and asserts nothing. Everything here is
 * reported as observation, because each signal has an honest explanation as
 * well as a dishonest one:
 *
 *  - a `chatcmpl-` id inside an Anthropic-shaped reply means a translation
 *    layer, which is what our own gateway is;
 *  - OpenAI-style `usage` keys in a Messages reply mean the same;
 *  - a missing id means a sloppy relay, not a fake model.
 *
 * The value is in the aggregate: over many lanes, "which of my Claude lanes
 * answer with a chatcmpl id" is a question worth being able to ask.
 */
/** Vendor whose response shape the envelope actually looks like. */
export type EnvelopeShape = "anthropic" | "openai" | "gemini" | "unknown";
export type ResponseMetadata = {
    /** Shape the payload matches, regardless of which API was called. */
    shape: EnvelopeShape;
    /** Shape the endpoint was asked to speak. */
    expected: EnvelopeShape;
    /** True when a translating hop sits between us and the model. */
    translated: boolean;
    /** e.g. "msg_", "chatcmpl-", "resp_"; null when the id is absent or odd. */
    idPrefix: string | null;
    /** Usage field names present, sorted. A cross-vendor mix is the tell. */
    usageKeys: string[];
    /** Foreign-vendor residue in the usage object, e.g. claude_* under OpenAI. */
    foreignUsageKeys: string[];
    /** Facts worth surfacing, in plain words. No verdict attached. */
    notes: string[];
};
export declare function readResponseMetadata(data: unknown, expected: EnvelopeShape): ResponseMetadata;
//# sourceMappingURL=response-metadata.d.ts.map