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
const ANTHROPIC_USAGE = new Set([
    "input_tokens",
    "output_tokens",
    "cache_read_input_tokens",
    "cache_creation_input_tokens",
]);
const OPENAI_USAGE = new Set([
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
]);
const GEMINI_USAGE = new Set([
    "promptTokenCount",
    "candidatesTokenCount",
    "totalTokenCount",
    "thoughtsTokenCount",
]);
function idPrefixOf(id) {
    if (typeof id !== "string" || id.length === 0)
        return null;
    for (const p of ["msg_", "chatcmpl-", "resp_", "call_", "toolu_"])
        if (id.startsWith(p))
            return p;
    // An unrecognised shape (a bare UUID, say) is itself worth reporting.
    const cut = id.search(/[-_]/);
    return cut > 0 ? id.slice(0, cut + 1) : "(none)";
}
function shapeOf(data, usageKeys) {
    if (data["candidates"] !== undefined || usageKeys.some((k) => GEMINI_USAGE.has(k)))
        return "gemini";
    if (data["choices"] !== undefined || usageKeys.some((k) => OPENAI_USAGE.has(k)))
        return "openai";
    if (data["content"] !== undefined || usageKeys.some((k) => ANTHROPIC_USAGE.has(k)))
        return "anthropic";
    return "unknown";
}
export function readResponseMetadata(data, expected) {
    const obj = (data ?? {});
    const usage = (obj["usage"] ?? {});
    const usageKeys = Object.keys(usage).sort();
    const shape = shapeOf(obj, usageKeys);
    const idPrefix = idPrefixOf(obj["id"]);
    const notes = [];
    // Usage keys belonging to a vendor other than the shape we are reading.
    const foreignUsageKeys = usageKeys.filter((k) => {
        if (k.startsWith("claude_"))
            return shape !== "anthropic";
        if (k.startsWith("gemini_"))
            return shape !== "gemini";
        if (ANTHROPIC_USAGE.has(k))
            return shape !== "anthropic";
        if (OPENAI_USAGE.has(k))
            return shape !== "openai";
        if (GEMINI_USAGE.has(k))
            return shape !== "gemini";
        return false;
    });
    const translated = shape !== "unknown" && shape !== expected;
    if (translated)
        notes.push(`answered in ${shape} shape though ${expected} was requested: a translating hop sits in front`);
    if (expected === "anthropic" && idPrefix && idPrefix !== "msg_")
        notes.push(`id starts "${idPrefix}" where Anthropic uses "msg_": the id was minted by something else`);
    if (foreignUsageKeys.length > 0)
        notes.push(`usage carries ${foreignUsageKeys.join(", ")}, which belong to another vendor's API`);
    return {
        shape,
        expected,
        translated,
        idPrefix,
        usageKeys,
        foreignUsageKeys,
        notes,
    };
}
//# sourceMappingURL=response-metadata.js.map