/**
 * The behavioural ladder over the four probes, one rule per rung, in the order
 * the table lists them. Each rule reads every probe's outcome, which is why the
 * probes are data and the rules are here.
 */
export declare const codingToolRule: import("./types").Rule<"coding-tool", "probes", "probe">;
export declare const scamRule: import("./types").Rule<"scam", "probes", "probe">;
export declare const cjkLeakRule: import("./types").Rule<"cjk-leak", "probes", "probe">;
/** Two probes whose reply never carried their nonce: the proxy mixes responses. */
export declare const muxRule: import("./types").Rule<"mux", "probes", "probe">;
/**
 * A foreign vendor on EITHER identity probe is a hard fail: a real model never
 * names a competitor as its maker. The reason lists every foreign probe.
 */
export declare const foreignRule: import("./types").Rule<"foreign", "probes", "probe">;
/** The reply's own `model` field names another tier than the one requested. */
export declare const servedModelMismatchRule: import("./types").Rule<"served-model-mismatch", "probes", "probe">;
/** The reply's `model` field is not the requested model at all (lenient spelling). */
export declare const substitutedRule: import("./types").Rule<"substituted", "probes", "probe">;
/**
 * Past the hard signals, the remaining failures are quality or transport. A
 * shortfall driven only by transient upstream errors is inconclusive: a real
 * lane that got rate limited mid-probe stays eligible and is probed again.
 */
export declare const quorumRule: import("./types").Rule<"quorum", "probes", "probe">;
/**
 * What the model calls itself is coachable and unstable: a kiro pool's system
 * prompt makes a real opus-4-6 answer "Claude 3.7 Sonnet" on one probe and
 * refuse on the next. Logged only; the reply's model field and the tokenizer
 * fingerprint are the evidence that fails a lane.
 */
export declare const tierSelfReportRule: import("./types").Rule<"tier-self-report", "probes", "note">;
//# sourceMappingURL=probe-ladder.d.ts.map