import {
  CJK_CHAR,
  CJK_LEAK_MIN_CHARS,
  CLOUD_HOST_PATTERNS,
  CODING_TOOL_NAMES,
  CODING_TOOL_REFUSAL_PATTERNS,
  SCAM_PAGE_PATTERNS,
} from "./patterns";
import type { ProbeLabel, ProbeSignal } from "../probes/table";
import type { VendorIdentity } from "../vendors/types";

export const includesAny = (text: string, patterns: readonly string[]) =>
  patterns.some((p) => text.includes(p));

const includesAnyWord = (text: string, words: readonly string[]) =>
  words.some((w) => new RegExp(`\\b${w}\\b`).test(text));

export const hasCodingToolRefusal = (text: string) =>
  includesAnyWord(text, CODING_TOOL_NAMES) ||
  includesAny(text, CODING_TOOL_REFUSAL_PATTERNS);

export const hasScamPage = (text: string) =>
  includesAny(text, SCAM_PAGE_PATTERNS);

/**
 * English prompts expect English answers; a substituted or distilled Chinese
 * model (or a corrupting proxy) leaks CJK into the reply even when it has
 * learned to say "anthropic".
 */
export function cjkLeak(text: string): boolean {
  const m = text.match(CJK_CHAR);
  return m !== null && m.length >= CJK_LEAK_MIN_CHARS;
}

export function hasForeignIdentity(
  text: string,
  identity: VendorIdentity,
  probe: ProbeLabel,
): boolean {
  if (includesAny(text, identity.foreign)) return true;
  if (probe === "model-name" && includesAny(text, identity.cloudModelNames))
    return true;
  return false;
}

export function detectSignal(
  text: string,
  probe: ProbeLabel,
  identity: VendorIdentity,
): ProbeSignal {
  if (text.length === 0) return "blank";
  if (hasCodingToolRefusal(text)) return "coding-tool";
  if (hasScamPage(text)) return "scam";
  if (cjkLeak(text)) return "cjk-leak";
  if (probe === "identity" || probe === "model-name") {
    if (hasForeignIdentity(text, identity, probe)) return "foreign";
    if (
      probe === "identity" &&
      identity.acceptsCloudHost &&
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
