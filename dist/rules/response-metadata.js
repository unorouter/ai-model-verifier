/**
 * Passive response metadata: what the envelope reveals about who really
 * answered, read from replies the run already made.
 *
 * Costs nothing and asserts nothing. Everything here is reported as
 * observation, because each signal has an honest explanation as well as a
 * dishonest one: a `chatcmpl-` id inside an Anthropic-shaped reply means a
 * translation layer, which is what our own gateway is; a missing id means a
 * sloppy relay, not a fake model. The value is in the aggregate: over many
 * lanes, "which of my Claude lanes answer with a chatcmpl id" is a question
 * worth being able to ask.
 */
import { richestProbe } from "../engine/probe-runner";
import { rec } from "../internal/utils";
import { ANTHROPIC_USAGE, envelopeShapeOf, GEMINI_USAGE, OPENAI_USAGE, } from "../vendors/shape";
import { defineRule } from "./types";
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
export function readResponseMetadata(data, expected) {
    const obj = rec(data) ?? {};
    const usageKeys = Object.keys(rec(obj["usage"]) ?? {}).sort();
    const shape = envelopeShapeOf(data);
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
/** Free metadata from the richest probe reply, read as the wire's shape. */
export const envelopeRule = defineRule({
    id: "envelope",
    layer: "note",
    needs: ["probes"],
    applies: () => true,
    judge: async () => null,
    report: async (ctx) => {
        const richest = richestProbe(await ctx.evidence("probes"));
        return richest
            ? {
                responseMetadata: readResponseMetadata(richest.raw, ctx.wire.envelope),
            }
            : {};
    },
});
//# sourceMappingURL=response-metadata.js.map