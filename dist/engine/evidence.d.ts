import type { TransportResult } from "../transport";
import { type RunCtx } from "./context";
import { type ProbeEval } from "./probe-runner";
export type FixedTextEvidence = {
    short: TransportResult;
    long: TransportResult;
};
export type ThinkingReplyEvidence = {
    res: TransportResult;
    /** Only when the strict replay ran: the endpoint accepted the block back. */
    replayAccepted?: boolean;
} | null;
/**
 * What the rules can ask for. Each key is collected at most once per run, so
 * two rules reading the same replies (token truth and the fingerprint both use
 * the fixed text) cost one set of requests.
 */
export type EvidenceBag = {
    probes: ProbeEval[];
    fixedText: FixedTextEvidence;
    /** null when the wire has no count endpoint or the short reply had no usage. */
    countTokens: TransportResult | null;
    /** null when the model has no thinking mode to ask for. */
    thinkingReply: ThinkingReplyEvidence;
    /** null when the model may legitimately answer without thinking. */
    floorReply: TransportResult | null;
};
export type EvidenceKey = keyof EvidenceBag;
/** Collection order when several keys are needed: probes first, then the extras. */
export declare const EVIDENCE_ORDER: readonly ["probes", "thinkingReply", "fixedText", "countTokens", "floorReply"];
export declare class EvidenceStore {
    private readonly probes;
    private readonly fixedText;
    private readonly countTokens;
    private readonly thinkingReply;
    private readonly floorReply;
    constructor(ctx: RunCtx);
    get<K extends EvidenceKey>(key: K): Promise<EvidenceBag[K]>;
}
//# sourceMappingURL=evidence.d.ts.map