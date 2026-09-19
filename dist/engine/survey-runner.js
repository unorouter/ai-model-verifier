import { echoesNonce } from "../probes/prompts";
import { SURVEY, stripNonce, } from "../probes/survey";
import { buildChat, callWire } from "./context";
const ANSWER_CAP = 2000;
async function ask(ctx, q) {
    const started = performance.now();
    const nonce = ctx.nonce();
    const prompt = q.prompt(nonce);
    const built = buildChat(ctx, {
        maxTokens: q.maxTokens,
        messages: [{ role: "user", content: prompt }],
    });
    const res = await callWire(ctx, built);
    const latencyMs = Math.round(performance.now() - started);
    const empty = {
        label: q.label,
        prompt,
        text: null,
        answer: null,
        nonced: false,
        correct: null,
        httpStatus: res.status,
        latencyMs,
        usage: null,
        reasoning: null,
        detectedModel: null,
    };
    const log = (pass, responseText, error) => ctx.onProbe?.({
        label: q.label,
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
        return { ...empty, error };
    }
    const text = ctx.wire.read.text(res.data);
    const meta = ctx.wire.read.meta(res.data);
    if (text === null) {
        log(false, null, "upstream error envelope");
        return {
            ...empty,
            usage: meta.usage,
            detectedModel: meta.detectedModel,
            error: "upstream error envelope",
        };
    }
    const answer = stripNonce(text, nonce);
    const correct = q.correct ? q.correct(answer) : null;
    log(correct !== false, text);
    return {
        ...empty,
        text: text.length > ANSWER_CAP ? `${text.slice(0, ANSWER_CAP)}...` : text,
        answer: answer.length > ANSWER_CAP ? `${answer.slice(0, ANSWER_CAP)}...` : answer,
        nonced: echoesNonce(text, nonce),
        correct,
        usage: meta.usage,
        reasoning: ctx.wire.read.reasoningUsage?.(res.data) ?? null,
        detectedModel: meta.detectedModel,
        error: null,
    };
}
export function collectSurvey(ctx) {
    return Promise.all(SURVEY.map((q) => ask(ctx, q)));
}
//# sourceMappingURL=survey-runner.js.map