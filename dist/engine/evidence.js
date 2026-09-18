import { COUNT_PROBE_MAX_TOKENS, FLOOR_PROMPT, LONG_PROMPT, SHORT_PROMPT, SIGNATURE_PROMPT, } from "../probes/prompts";
import { callWire, chat, wireCtx } from "./context";
import { collectProbes } from "./probe-runner";
const THINKING_BUDGET_TOKENS = 2000;
/** Thinking plus answer; too small and an adaptive model skips thinking to fit. */
const SIGNATURE_MAX_TOKENS = 16000;
/** Room for the thoughts plus the word; too small truncates thinking and reads as a fake. */
const FLOOR_MAX_TOKENS = 2048;
/** Collection order when several keys are needed: probes first, then the extras. */
export const EVIDENCE_ORDER = [
    "probes",
    "thinkingReply",
    "fixedText",
    "countTokens",
    "floorReply",
];
const ok = (r) => r.status !== null && r.status < 400;
async function collectFixedText(ctx) {
    const ask = (prompt) => chat(ctx, {
        maxTokens: COUNT_PROBE_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
    });
    const [short, long] = await Promise.all([ask(SHORT_PROMPT), ask(LONG_PROMPT)]);
    return { short, long };
}
async function collectCountTokens(ctx, store) {
    const count = ctx.wire.ops.countTokens;
    if (!count)
        return null;
    const { short } = await store.get("fixedText");
    if (!ok(short) || ctx.wire.read.meta(short.data).usage?.prompt == null)
        return null;
    return callWire(ctx, count({
        model: ctx.model,
        messages: [{ role: "user", content: SHORT_PROMPT }],
    }, wireCtx(ctx)));
}
async function collectThinkingReply(ctx) {
    const kind = ctx.facts.thinking;
    if (kind === "none")
        return null;
    const messages = [{ role: "user", content: SIGNATURE_PROMPT }];
    // Non-streaming on purpose: streaming an adaptive model silently drops the
    // thinking block, so a real Claude would look unsigned.
    const res = await chat(ctx, {
        maxTokens: SIGNATURE_MAX_TOKENS,
        messages,
        thinking: { kind, budgetTokens: THINKING_BUDGET_TOKENS },
    });
    if (!ctx.checks.signature?.strict || !ok(res))
        return { res };
    const found = ctx.wire.read.thinkingBlock?.(res.data);
    if (!found)
        return { res };
    // Hand the block back. Against the vendor this re-validates the signature;
    // through a relay it does not (a forged 308-byte signature returned 200 on
    // both upstreams measured), so it is reported as evidence, never a verdict.
    const replay = await chat(ctx, {
        maxTokens: 1,
        messages: [...messages, { role: "assistant", content: [found.block] }],
    });
    // A network failure proves nothing; only an explicit rejection counts.
    return { res, replayAccepted: replay.status === null || replay.status < 400 };
}
async function collectFloorReply(ctx) {
    if (!ctx.facts.alwaysThinks)
        return null;
    return chat(ctx, {
        maxTokens: FLOOR_MAX_TOKENS,
        messages: [{ role: "user", content: FLOOR_PROMPT }],
    });
}
const memo = (fn) => {
    let p;
    return () => (p ??= fn());
};
export class EvidenceStore {
    probes;
    fixedText;
    countTokens;
    thinkingReply;
    floorReply;
    constructor(ctx) {
        this.probes = memo(() => collectProbes(ctx));
        this.fixedText = memo(() => collectFixedText(ctx));
        this.countTokens = memo(() => collectCountTokens(ctx, this));
        this.thinkingReply = memo(() => collectThinkingReply(ctx));
        this.floorReply = memo(() => collectFloorReply(ctx));
    }
    get(key) {
        switch (key) {
            case "probes":
                return this.probes();
            case "fixedText":
                return this.fixedText();
            case "countTokens":
                return this.countTokens();
            case "thinkingReply":
                return this.thinkingReply();
            case "floorReply":
                return this.floorReply();
        }
    }
}
//# sourceMappingURL=evidence.js.map