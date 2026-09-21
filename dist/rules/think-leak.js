/**
 * Reasoning returned inside the content: the relay strips nothing, and the
 * identity probes then read the model's deliberation instead of its answer.
 * A fact about the lane; the model behind it may be the real one.
 */
import { defineRule } from "./types";
const THINK_TAG = /<\/?think>/;
export const thinkLeakRule = defineRule({
    id: "think-leak",
    layer: "note",
    needs: ["probes"],
    applies: () => true,
    judge: async (ctx) => {
        const labels = (await ctx.evidence("probes"))
            .filter((p) => p.text !== undefined && THINK_TAG.test(p.text))
            .map((p) => p.label);
        return labels.length > 0
            ? {
                severity: "note",
                reason: `think-leak: reasoning in the content on ${labels.join(", ")}`,
                data: { labels },
            }
            : null;
    },
});
//# sourceMappingURL=think-leak.js.map