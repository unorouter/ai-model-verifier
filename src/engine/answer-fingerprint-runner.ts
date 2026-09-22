import {
  classifyAnswer,
  FINGERPRINT_CELLS,
  type FingerprintCell,
  type FingerprintLabel,
} from "../probes/answer-fingerprint";
import { buildChat, callWire, type RunCtx } from "./context";

/** Room for a "Sure, " prefix; thinkers get the facts' floor on top. */
const CELL_MAX_TOKENS = 32;
const TEMPERATURE = 1;
const RAW_CAP = 200;

export type FingerprintCellSample = {
  /** Canonical answer to how often it came. */
  answers: Record<string, number>;
  valid: number;
  refusal: number;
  invalid: number;
  empty: number;
  /** Transport or envelope errors, not answers. */
  errors: number;
};

/** Per cell counts from one run; merge runs with `mergeFingerprints`. */
export type FingerprintSample = {
  cells: Record<string, FingerprintCellSample>;
  calls: number;
  temperature: number;
  /** Raw replies of this run, capped, for the record. */
  raw?: { cell: FingerprintLabel; text: string | null; error?: string }[];
  detectedModel: string | null;
  latencyMs: number;
};

export const emptyCell = (): FingerprintCellSample => ({
  answers: {},
  valid: 0,
  refusal: 0,
  invalid: 0,
  empty: 0,
  errors: 0,
});

async function askOnce(
  ctx: RunCtx,
  cell: FingerprintCell<FingerprintLabel>,
): Promise<{ text: string | null; error?: string; detectedModel: string | null }> {
  const built = buildChat(ctx, {
    maxTokens: CELL_MAX_TOKENS,
    temperature: TEMPERATURE,
    messages: [{ role: "user", content: cell.prompt }],
  });
  const res = await callWire(ctx, built);
  const log = (pass: boolean, responseText: string | null, error?: string) =>
    ctx.onProbe?.({
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

type Reply = Awaited<ReturnType<typeof askOnce>>;

/**
 * A few calls in flight per lane: 24 in a row cost minutes on a thinker, and a
 * marketplace throttles per merchant, so never all of them at once.
 */
export async function collectAnswerFingerprint(
  ctx: RunCtx,
): Promise<FingerprintSample> {
  const started = performance.now();
  const repeats = ctx.checks.answerFingerprint?.repeats ?? 0;
  const width = Math.max(1, ctx.checks.answerFingerprint?.concurrency ?? 1);
  const jobs = FINGERPRINT_CELLS.flatMap((cell) =>
    Array.from({ length: repeats }, () => cell),
  );
  const replies: Reply[] = [];
  let next = 0;
  const worker = async (): Promise<void> => {
    for (let i = next++; i < jobs.length; i = next++) {
      const cell = jobs[i];
      if (cell) replies[i] = await askOnce(ctx, cell);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(width, jobs.length) }, worker),
  );

  const cells: Record<string, FingerprintCellSample> = {};
  for (const cell of FINGERPRINT_CELLS) cells[cell.label] = emptyCell();
  const raw: NonNullable<FingerprintSample["raw"]> = [];
  let detectedModel: string | null = null;
  for (const [i, cell] of jobs.entries()) {
    const r = replies[i];
    const c = cells[cell.label];
    if (!r || !c) continue;
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
    if (answer !== null) c.answers[answer] = (c.answers[answer] ?? 0) + 1;
  }
  return {
    cells,
    calls: jobs.length,
    temperature: TEMPERATURE,
    raw,
    detectedModel,
    latencyMs: Math.round(performance.now() - started),
  };
}
