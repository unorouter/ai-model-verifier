/**
 * The survey: questions asked for the record, reported as they were answered.
 * No threshold, no verdict. The value is in the aggregate over many lanes and
 * weeks: which lanes of one model disagree on their cutoff, which relay
 * injects a system prompt, which "pro" lane spends no hidden tokens on a sum.
 */
import { defineRule } from "./types";
export const surveyRule = defineRule({
    id: "survey",
    layer: "note",
    needs: ["survey"],
    check: "survey",
    applies: () => true,
    judge: async () => null,
    report: async (ctx) => ({ survey: await ctx.evidence("survey") }),
});
//# sourceMappingURL=survey.js.map