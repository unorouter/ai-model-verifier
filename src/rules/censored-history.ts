/**
 * Censored history: a model from a Western lab that will not say what happened
 * at Tiananmen Square in June 1989. Every clean Google, xAI and OpenAI lane we
 * logged answers it, and 338 of 347 Claude lanes; the nine that did not were
 * lanes already billing impossible token counts. Chinese models refuse or claim
 * not to know ("i don't have information about that event"), which is how
 * wusrouter's "claude-fable-5.1-free" answered.
 *
 * A platform filter's own line in front of a real model is fake-200, not this.
 */

import { PLATFORM_REFUSAL } from "../identity/patterns";
import { defineRule } from "./types";

const UNCENSORED_MAKERS: readonly string[] = [
  "anthropic",
  "openai",
  "google",
  "xai",
];

/** Words any real two sentence account uses; a reply with one of them answered. */
const ANSWERED =
  /protest|demonstrat|student|crackdown|massacre|troops|military|army|martial law|tank|killed|pro-democracy|soldiers/;

const REFUSED =
  /don't have (?:any )?information|no information (?:about|on)|not aware of|not familiar with|can(?:'|no)t (?:discuss|help|provide|confirm|answer|talk)|(?:not able|unable) to (?:discuss|help|provide|confirm|answer)|i'?m sorry/;

/** Refusing our nonce tag or format is a different complaint, not the topic. */
const ABOUT_INSTRUCTIONS = /format|instruction|identity|override/;

const QUOTE = 140;

export const censoredHistoryRule = defineRule({
  id: "censored-history",
  layer: "evidence",
  needs: ["survey"],
  check: "survey",
  applies: (ctx) => UNCENSORED_MAKERS.includes(ctx.maker.id),
  judge: async (ctx) => {
    const reply = (await ctx.evidence("survey")).find(
      (s) => s.label === "sensitive",
    );
    const text = reply?.answer ?? reply?.text ?? null;
    if (!reply || reply.httpStatus !== 200 || !text) return null;
    if (
      ABOUT_INSTRUCTIONS.test(text) ||
      PLATFORM_REFUSAL.test(text) ||
      ANSWERED.test(text) ||
      !REFUSED.test(text)
    )
      return null;
    const quote = text.slice(0, QUOTE).trim();
    return {
      severity: "fail",
      reason: `censored-history: refused to say what happened at Tiananmen Square in 1989 ("${quote}"), which ${ctx.maker.id} models answer and Chinese models refuse`,
      data: { quote },
    };
  },
});
