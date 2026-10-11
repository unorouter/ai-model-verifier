/**
 * A lane serving one model under another's name injects a prompt telling it
 * to deny the backend. Coached replies pass every identity probe, but the
 * model's own reasoning restates the coaching, so the probes' reasoning (and
 * any reasoning leaked into the content) is searched for that instruction.
 */

import {
  MASKING_DECLARED_IDENTITY,
  MASKING_HIDDEN_BACKEND,
  MASKING_INSTRUCTED,
  MASKING_VERB,
} from "../identity/patterns";
import { includesAnyWord } from "../identity/signals";
import type { RunCtx } from "../engine/context";
import { defineRule } from "./types";

const WINDOW = 80;

function maskingHit(text: string, ctx: RunCtx): string | null {
  if (!MASKING_INSTRUCTED.test(text)) return null;
  if (MASKING_DECLARED_IDENTITY.test(text))
    return text.match(MASKING_DECLARED_IDENTITY)?.[0] ?? null;
  for (const m of text.matchAll(MASKING_VERB)) {
    const after = text.slice(m.index, m.index + m[0].length + WINDOW);
    if (
      MASKING_HIDDEN_BACKEND.test(after) ||
      includesAnyWord(after, ctx.maker.foreign)
    )
      return after.trim();
  }
  return null;
}

export const maskedIdentityRule = defineRule({
  id: "masked-identity",
  layer: "evidence",
  needs: ["probes"],
  applies: () => true,
  judge: async (ctx) => {
    const hits: { label: string; quote: string }[] = [];
    for (const p of await ctx.evidence("probes")) {
      const thought = ctx.wire.read.reasoningText?.(p.raw) ?? "";
      for (const source of [thought, p.text ?? ""]) {
        const quote = source ? maskingHit(source, ctx) : null;
        if (quote) {
          hits.push({ label: p.label, quote });
          break;
        }
      }
    }
    return hits.length > 0
      ? {
          severity: "suspect",
          reason: `masked-identity: told to hide its backend (${hits[0]!.label}: "${hits[0]!.quote}")`,
          data: { hits },
        }
      : null;
  },
});
