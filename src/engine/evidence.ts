import {
  COUNT_PROBE_MAX_TOKENS,
  DIVERSE_PROMPT,
  ASKED_THINKING_PROMPT,
  FLOOR_PROMPT,
  LONG_PROMPT,
  SHORT_PROMPT,
  SIGNATURE_PROMPT,
  SCRIPT_BASE_PROMPT,
  SCRIPT_VARIANTS,
  type ScriptVariant,
} from "../probes/prompts";
import type { TransportResult } from "../transport";
import { isTransientError } from "../identity/signals";
import { callWire, chat, wireCtx, type RunCtx } from "./context";
import { collectProbes, type ProbeEval } from "./probe-runner";
import { collectSurvey, type SurveyOutcome } from "./survey-runner";
import {
  collectAnswerFingerprint,
  type FingerprintSample,
} from "./answer-fingerprint-runner";

const THINKING_BUDGET_TOKENS = 2000;
/** Thinking plus answer; too small and an adaptive model skips thinking to fit. */
const SIGNATURE_MAX_TOKENS = 16000;
/** Room for the thoughts plus the word; too small truncates thinking and reads as a fake. */
const FLOOR_MAX_TOKENS = 2048;

export type FixedTextEvidence = {
  short: TransportResult;
  long: TransportResult;
  /** The script-mixed text every vocabulary splits differently. */
  diverse: TransportResult;
};

export type ScriptTokensEvidence = {
  base: TransportResult;
  variants: Record<ScriptVariant, TransportResult>;
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
  /** The survey answers, recorded as they came. */
  survey: SurveyOutcome[];
  /** One-word answer counts at temperature 1, for a caller to accumulate. */
  answerFingerprint: FingerprintSample;
  fixedText: FixedTextEvidence;
  /** The anchor and the four script runs the tokenizer family is read from. */
  scriptTokens: ScriptTokensEvidence;
  /** null when the wire has no count endpoint or the short reply had no usage. */
  countTokens: TransportResult | null;
  /** null when the model has no thinking mode to ask for. */
  thinkingReply: ThinkingReplyEvidence;
  /** null when the model may legitimately answer without thinking. */
  floorReply: TransportResult | null;
  /** null unless the model thinks only when asked: the reply to a high-effort request. */
  askedThinkingReply: TransportResult | null;
};

export type EvidenceKey = keyof EvidenceBag;

/** Collection order when several keys are needed: probes first, then the extras. */
export const EVIDENCE_ORDER = [
  "probes",
  "survey",
  "answerFingerprint",
  "thinkingReply",
  "fixedText",
  "scriptTokens",
  "countTokens",
  "floorReply",
  "askedThinkingReply",
] as const satisfies readonly EvidenceKey[];

const ok = (r: TransportResult) => r.status !== null && r.status < 400;

async function collectFixedText(ctx: RunCtx): Promise<FixedTextEvidence> {
  const ask = (prompt: string) =>
    chat(ctx, {
      maxTokens: COUNT_PROBE_MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });
  const [short, long, diverse] = await Promise.all([
    ask(SHORT_PROMPT),
    ask(LONG_PROMPT),
    ask(DIVERSE_PROMPT),
  ]);
  return { short, long, diverse };
}

const SCRIPT_RETRY_MS = 1500;

const transient = (r: TransportResult) =>
  r.status === null
    ? isTransientError(r.error ?? "")
    : isTransientError(`HTTP ${r.status}`);

async function collectScriptTokens(ctx: RunCtx): Promise<ScriptTokensEvidence> {
  // One more try on a busy answer: a timed out anchor left wusrouter's made up
  // counts unmeasured, and an unmeasured family never fails.
  const ask = async (prompt: string) => {
    const send = () =>
      chat(ctx, {
        maxTokens: COUNT_PROBE_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      });
    const first = await send();
    if (!transient(first)) return first;
    await new Promise((resolve) => setTimeout(resolve, SCRIPT_RETRY_MS));
    return send();
  };
  // The anchor first: a relay that caches prefixes then bills every run the same way.
  const base = await ask(SCRIPT_BASE_PROMPT);
  const run = (k: ScriptVariant) =>
    ask(SCRIPT_BASE_PROMPT + SCRIPT_VARIANTS[k]);
  const [digits, cjk, spaces, code] = await Promise.all([
    run("digits"),
    run("cjk"),
    run("spaces"),
    run("code"),
  ]);
  return { base, variants: { digits, cjk, spaces, code } };
}

async function collectCountTokens(
  ctx: RunCtx,
  store: EvidenceStore,
): Promise<TransportResult | null> {
  const count = ctx.wire.ops.countTokens;
  if (!count) return null;
  const { short } = await store.get("fixedText");
  if (!ok(short) || ctx.wire.read.meta(short.data).usage?.prompt == null)
    return null;
  return callWire(
    ctx,
    count(
      {
        model: ctx.model,
        messages: [{ role: "user", content: SHORT_PROMPT }],
      },
      wireCtx(ctx),
    ),
  );
}

async function collectThinkingReply(
  ctx: RunCtx,
): Promise<ThinkingReplyEvidence> {
  const kind = ctx.facts.thinking;
  if (kind === "none") return null;
  const messages = [{ role: "user" as const, content: SIGNATURE_PROMPT }];
  // Non-streaming on purpose: streaming an adaptive model silently drops the
  // thinking block, so a real Claude would look unsigned.
  const res = await chat(ctx, {
    maxTokens: SIGNATURE_MAX_TOKENS,
    messages,
    thinking: { kind, budgetTokens: THINKING_BUDGET_TOKENS },
  });
  if (!ctx.checks.signature?.strict || !ok(res)) return { res };
  const found = ctx.wire.read.thinkingBlock?.(res.data);
  if (!found) return { res };
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

async function collectFloorReply(ctx: RunCtx): Promise<TransportResult | null> {
  if (!ctx.facts.alwaysThinks) return null;
  return chat(ctx, {
    maxTokens: FLOOR_MAX_TOKENS,
    messages: [{ role: "user", content: FLOOR_PROMPT }],
  });
}

async function collectAskedThinkingReply(
  ctx: RunCtx,
): Promise<TransportResult | null> {
  if (!ctx.facts.thinksWhenAsked) return null;
  return chat(ctx, {
    maxTokens: FLOOR_MAX_TOKENS,
    reasoningEffort: "high",
    messages: [{ role: "user", content: ASKED_THINKING_PROMPT }],
  });
}

const memo = <T>(fn: () => Promise<T>) => {
  let p: Promise<T> | undefined;
  return () => (p ??= fn());
};

export class EvidenceStore {
  private readonly probes: () => Promise<ProbeEval[]>;
  private readonly survey: () => Promise<SurveyOutcome[]>;
  private readonly answerFingerprint: () => Promise<FingerprintSample>;
  private readonly fixedText: () => Promise<FixedTextEvidence>;
  private readonly scriptTokens: () => Promise<ScriptTokensEvidence>;
  private readonly countTokens: () => Promise<TransportResult | null>;
  private readonly thinkingReply: () => Promise<ThinkingReplyEvidence>;
  private readonly floorReply: () => Promise<TransportResult | null>;
  private readonly askedThinkingReply: () => Promise<TransportResult | null>;

  constructor(ctx: RunCtx) {
    this.probes = memo(() => collectProbes(ctx));
    this.survey = memo(() => collectSurvey(ctx));
    this.answerFingerprint = memo(() => collectAnswerFingerprint(ctx));
    this.fixedText = memo(() => collectFixedText(ctx));
    this.scriptTokens = memo(() => collectScriptTokens(ctx));
    this.countTokens = memo(() => collectCountTokens(ctx, this));
    this.thinkingReply = memo(() => collectThinkingReply(ctx));
    this.floorReply = memo(() => collectFloorReply(ctx));
    this.askedThinkingReply = memo(() => collectAskedThinkingReply(ctx));
  }

  get<K extends EvidenceKey>(key: K): Promise<EvidenceBag[K]>;
  get(key: EvidenceKey): Promise<EvidenceBag[EvidenceKey]> {
    switch (key) {
      case "probes":
        return this.probes();
      case "survey":
        return this.survey();
      case "answerFingerprint":
        return this.answerFingerprint();
      case "fixedText":
        return this.fixedText();
      case "scriptTokens":
        return this.scriptTokens();
      case "countTokens":
        return this.countTokens();
      case "thinkingReply":
        return this.thinkingReply();
      case "floorReply":
        return this.floorReply();
      case "askedThinkingReply":
        return this.askedThinkingReply();
    }
  }
}
