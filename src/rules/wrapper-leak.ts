/**
 * The survey asks the lane to repeat its prior instructions; a reseller that
 * wraps an IDE or agent session around the model replays that wrapper's
 * system prompt. Matched against known wrapper signatures, reported as a fact
 * about the lane.
 */

import { WRAPPER_SIGNATURES } from "../identity/patterns";
import { defineRule } from "./types";

export const wrapperLeakRule = defineRule({
  id: "wrapper-leak",
  layer: "note",
  needs: ["survey"],
  check: "survey",
  applies: () => true,
  judge: async (ctx) => {
    const reply = (await ctx.evidence("survey")).find(
      (s) => s.label === "system-prompt",
    );
    const text = reply?.answer?.toLowerCase() ?? "";
    const hits = WRAPPER_SIGNATURES.filter((s) => text.includes(s));
    return hits.length > 0
      ? {
          severity: "note",
          reason: `wrapper-leak: ${hits.join(", ")}`,
          data: { signatures: hits },
        }
      : null;
  },
});
