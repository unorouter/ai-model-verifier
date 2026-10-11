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
export declare const maskContradictionRule: import("./types").Rule<"mask-contradiction", "survey", "note">;
//# sourceMappingURL=mask-contradiction.d.ts.map