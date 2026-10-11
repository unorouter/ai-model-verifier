/**
 * A platform refusal or error page sent as the model's answer at HTTP 200. The
 * gateway in front of the lane bills it as a reply and never fails over, so a
 * user sees "unable to provide content" or the reseller's own error markup in
 * place of the model. Read from every answered probe and survey reply, so it
 * runs with the survey, whose sensitive question is the one that trips filters.
 */

import { PLATFORM_REFUSAL } from "../identity/patterns";
import { defineRule } from "./types";

const QUOTE = 120;

export const fake200Rule = defineRule({
  id: "fake-200",
  layer: "evidence",
  needs: ["probes", "survey"],
  check: "survey",
  applies: () => true,
  judge: async (ctx) => {
    const replies: { label: string; text: string }[] = [];
    for (const p of await ctx.evidence("probes"))
      if (p.httpStatus === 200 && p.text) replies.push({ label: p.label, text: p.text });
    for (const s of await ctx.evidence("survey"))
      if (s.httpStatus === 200 && s.text) replies.push({ label: s.label, text: s.text });
    const hit = replies.find((r) => PLATFORM_REFUSAL.test(r.text));
    if (!hit) return null;
    const at = hit.text.search(PLATFORM_REFUSAL);
    const quote = hit.text.slice(Math.max(0, at - 20), at + QUOTE).trim();
    return {
      severity: "suspect",
      reason: `fake-200: platform refusal sent as the reply (${hit.label}: "${quote}")`,
      data: { label: hit.label, quote },
    };
  },
});
