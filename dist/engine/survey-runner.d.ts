import { type SurveyLabel } from "../probes/survey";
import type { ProbeUsage, ReasoningUsage } from "../vendors/types";
import { type RunCtx } from "./context";
/** One survey answer as it came; nothing here decides anything. */
export type SurveyOutcome = {
    label: SurveyLabel;
    prompt: string;
    /** Reply text, lowercased by the wire reader, capped; null on no answer. */
    text: string | null;
    /** The reply without the nonce tag; null on no answer. */
    answer: string | null;
    /** The reply carried its nonce, so it belongs to this request. */
    nonced: boolean;
    /** Fact check where the question has one; null otherwise or on no answer. */
    correct: boolean | null;
    httpStatus: number | null;
    latencyMs: number;
    usage: ProbeUsage | null;
    /** Hidden and visible output counts when the wire reports them. */
    reasoning: ReasoningUsage | null;
    detectedModel: string | null;
    error: string | null;
};
export declare function collectSurvey(ctx: RunCtx): Promise<SurveyOutcome[]>;
//# sourceMappingURL=survey-runner.d.ts.map