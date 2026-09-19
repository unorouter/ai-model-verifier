import {
  CJK_CHAR,
  CJK_LEAK_MIN_CHARS,
  CLOUD_HOST_PATTERNS,
  CODING_TOOL_NAMES,
  CODING_TOOL_REFUSAL_PATTERNS,
  SCAM_PAGE_PATTERNS,
} from "./patterns";
import type { ResolvedMaker } from "../makers/types";
import type { ProbeLabel, ProbeSignal } from "../probes/table";

export const includesAny = (text: string, patterns: readonly string[]) =>
  patterns.some((p) => text.includes(p));

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Maker vocabulary is short ("meta", "o3", "glm"), so it is matched on word
 * boundaries: no letter or digit before, no letter after. A digit or hyphen
 * may follow ("qwen3", "gpt-5", "o3-mini"); "metadata" and "zaid" never hit.
 */
export const hasWord = (text: string, word: string): boolean =>
  new RegExp(`(?<![a-z0-9])${escapeRegExp(word)}(?![a-z])`).test(text);

export const includesAnyWord = (text: string, words: readonly string[]) =>
  words.some((w) => hasWord(text, w));

export const hasCodingToolRefusal = (text: string) =>
  CODING_TOOL_NAMES.some((w) => new RegExp(`\\b${w}\\b`).test(text)) ||
  includesAny(text, CODING_TOOL_REFUSAL_PATTERNS);

export const hasScamPage = (text: string) =>
  includesAny(text, SCAM_PAGE_PATTERNS);

/**
 * English prompts expect English answers; a substituted or distilled Chinese
 * model (or a corrupting proxy) leaks CJK into the reply even when it has
 * learned to say "anthropic". Not a tell for a maker that trains on Chinese.
 */
export function cjkLeak(text: string, maker?: ResolvedMaker): boolean {
  if (maker?.cjkNative) return false;
  const m = text.match(CJK_CHAR);
  return m !== null && m.length >= CJK_LEAK_MIN_CHARS;
}

export function hasForeignIdentity(
  text: string,
  maker: ResolvedMaker,
  probe: ProbeLabel,
): boolean {
  if (includesAnyWord(text, maker.foreign)) return true;
  if (probe === "model-name" && includesAnyWord(text, maker.cloudModelNames))
    return true;
  return false;
}

export function detectSignal(
  text: string,
  probe: ProbeLabel,
  maker: ResolvedMaker,
): ProbeSignal {
  if (text.length === 0) return "blank";
  if (hasCodingToolRefusal(text)) return "coding-tool";
  if (hasScamPage(text)) return "scam";
  if (cjkLeak(text, maker)) return "cjk-leak";
  if (probe === "identity" || probe === "model-name") {
    if (hasForeignIdentity(text, maker, probe)) return "foreign";
    if (
      probe === "identity" &&
      maker.acceptsCloudHost &&
      includesAny(text, CLOUD_HOST_PATTERNS)
    )
      return "cloud-host";
  }
  return null;
}

const TRANSIENT_HTTP = [408, 425, 429, 500, 502, 503, 504, 520, 522, 524];

export function isTransientError(msg: string): boolean {
  const m = msg.match(/HTTP (\d{3})/);
  if (m && TRANSIENT_HTTP.includes(Number(m[1]))) return true;
  const lower = msg.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("econnreset") ||
    lower.includes("socket") ||
    lower.includes("network") ||
    lower.includes("fetch failed")
  );
}
