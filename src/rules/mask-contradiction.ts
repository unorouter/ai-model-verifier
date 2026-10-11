/**
 * The survey asks the lane to replay its prior instructions. A relay that
 * stamps its own brand on the real model ("you are deepseek-v4-flash, provided
 * by X") is not evidence of a swap: across 266 masked lanes on 2026-10-11 the
 * swap signals ran no higher than on unmasked ones. A mask that assigns
 * another maker's identity is: "you are claude" on a glm lane means the lane
 * either serves claude under the glm name or coaches glm to pose as claude.
 * A note, not evidence: asked to repeat instructions it never got, a model
 * recites a remembered one ("you are chatgpt, a large language model trained
 * by openai"), and every hit in 3 weeks was a single run out of 20 to 57.
 */

import {
  IDENTITY_ASSIGNMENT,
  NEGATED_ASSIGNMENT,
  REPLAY_REFUSAL,
  WRAPPER_PRODUCTS,
} from "../identity/patterns";
import { includesAnyWord } from "../identity/signals";
import { defineRule } from "./types";

export const maskContradictionRule = defineRule({
  id: "mask-contradiction",
  layer: "note",
  needs: ["survey"],
  check: "survey",
  applies: () => true,
  judge: async (ctx) => {
    const reply = (await ctx.evidence("survey")).find(
      (s) => s.label === "system-prompt",
    );
    const text = reply?.answer?.toLowerCase() ?? "";
    if (!text || REPLAY_REFUSAL.test(text)) return null;
    for (const m of text.matchAll(IDENTITY_ASSIGNMENT)) {
      const assigned = m[1]!.trim();
      if (NEGATED_ASSIGNMENT.test(assigned) || WRAPPER_PRODUCTS.test(assigned))
        continue;
      if (includesAnyWord(assigned, ctx.maker.foreign))
        return {
          severity: "note",
          reason: `mask-contradiction: the injected prompt says "${m[0].trim()}"`,
          data: { assigned },
        };
    }
    return null;
  },
});
