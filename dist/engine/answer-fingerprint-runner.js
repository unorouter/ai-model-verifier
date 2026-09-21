import { classifyAnswer, FINGERPRINT_CELLS, } from "../probes/answer-fingerprint";
import { buildChat, callWire } from "./context";
/** Room for a "Sure, " prefix; thinkers get the facts' floor on top. */
const CELL_MAX_TOKENS = 32;
const TEMPERATURE = 1;
const RAW_CAP = 200;
export const emptyCell = () => ({
    answers: {},
    valid: 0,
    refusal: 0,
    invalid: 0,
    empty: 0,
    errors: 0,
});
async function askOnce(ctx, cell) {
    const built = buildChat(ctx, {
        maxTokens: CELL_MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: [{ role: "user", content: cell.prompt }],
    });
    const res = await callWire(ctx, built);
    const log = (pass, responseText, error) => ctx.onProbe?.({
        label: `answer-fingerprint:${cell.label}`,
        attempt: 0,
        pass,
        signal: null,
        request: built,
        responseText,
        ...(error !== undefined ? { error } : {}),
    });
    if (res.error !== null || res.status === null || res.status >= 400) {
        const error = res.error ?? `HTTP ${res.status}`;
        log(false, null, error);
        return { text: null, error, detectedModel: null };
    }
    const text = ctx.wire.read.text(res.data);
    const detectedModel = ctx.wire.read.meta(res.data).detectedModel;
    if (text === null) {
        log(false, null, "upstream error envelope");
        return { text: null, error: "upstream error envelope", detectedModel };
    }
    log(true, text);
    return { text, detectedModel };
}
/**
 * Every call sequential: the marketplaces throttle per account and the
 * caller's pacing may not know this host. Lanes run in parallel elsewhere.
 */
export async function collectAnswerFingerprint(ctx) {
    const started = performance.now();
    const repeats = ctx.checks.answerFingerprint?.repeats ?? 0;
    const cells = {};
    const raw = [];
    let detectedModel = null;
    let calls = 0;
    for (const cell of FINGERPRINT_CELLS) {
        const c = emptyCell();
        for (let i = 0; i < repeats; i++) {
            const r = await askOnce(ctx, cell);
            calls++;
            detectedModel ??= r.detectedModel;
            raw.push({
                cell: cell.label,
                text: r.text === null ? null : r.text.slice(0, RAW_CAP),
                ...(r.error !== undefined ? { error: r.error } : {}),
            });
            if (r.error !== undefined) {
                c.errors++;
                continue;
            }
            const { answer, cls } = classifyAnswer(r.text, cell);
            c[cls]++;
            if (answer !== null)
                c.answers[answer] = (c.answers[answer] ?? 0) + 1;
        }
        cells[cell.label] = c;
    }
    return {
        cells,
        calls,
        temperature: TEMPERATURE,
        raw,
        detectedModel,
        latencyMs: Math.round(performance.now() - started),
    };
}
//# sourceMappingURL=answer-fingerprint-runner.js.map