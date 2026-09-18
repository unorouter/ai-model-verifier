import {
  cjkLeak,
  hasCodingToolRefusal,
  hasForeignIdentity,
  hasScamPage,
  includesAny,
} from "../identity/signals";
import {
  CLOUD_HOST_PATTERNS,
  FAKE_RESPONSE_SIGNATURES,
} from "../identity/patterns";
import type { VendorAdapter } from "../vendors/types";
import { nonceTag } from "./prompts";

/**
 * A probe is a request plus a grader for its own reply. Probes are data, not
 * rules: the ladder rules read across every probe's outcome (a quorum, a mux
 * count), so a probe judging itself would be the wrong unit.
 */
export type ProbeDef<L extends string = string> = {
  label: L;
  maxTokens: number;
  prompt(nonce: string): string;
  grade(text: string, wire: VendorAdapter): boolean;
};

export const PROBES = [
  {
    label: "emotional",
    maxTokens: 200,
    prompt: (n: string) =>
      `Tell me a 2-sentence sad story about a lost kitten. ${nonceTag(n)}`,
    grade: (text: string) =>
      !hasCodingToolRefusal(text) && !cjkLeak(text) && text.length >= 40,
  },
  {
    label: "creative",
    maxTokens: 120,
    prompt: (n: string) =>
      `Write a haiku about the ocean at sunrise. ${nonceTag(n)}`,
    grade: (text: string) =>
      !hasCodingToolRefusal(text) && !cjkLeak(text) && text.length >= 25,
  },
  {
    label: "identity",
    maxTokens: 60,
    prompt: (n: string) =>
      "Which AI lab developed and trained the model you are running on? " +
      "Not the company hosting you, the lab that trained the model. " +
      `One word answer. ${nonceTag(n)}`,
    grade: (text: string, wire: VendorAdapter) => {
      if (hasCodingToolRefusal(text) || hasScamPage(text)) return false;
      if (hasForeignIdentity(text, wire.identity, "identity")) return false;
      if (includesAny(text, wire.identity.home)) return true;
      return (
        wire.identity.acceptsCloudHost && includesAny(text, CLOUD_HOST_PATTERNS)
      );
    },
  },
  {
    label: "model-name",
    maxTokens: 80,
    prompt: (n: string) =>
      `Which model are you? Reply with only your model name. ${nonceTag(n)}`,
    grade: (text: string, wire: VendorAdapter) => {
      if (hasCodingToolRefusal(text) || hasScamPage(text)) return false;
      if (hasForeignIdentity(text, wire.identity, "model-name")) return false;
      if (!includesAny(text, wire.identity.homeModelNames)) return false;
      const stripped = text.replace(/^\s*\[[a-z0-9]{4,8}\]\s*/i, "").trim();
      return !FAKE_RESPONSE_SIGNATURES.includes(stripped);
    },
  },
] as const satisfies readonly ProbeDef[];

export type ProbeLabel = (typeof PROBES)[number]["label"];

export const PROBE_SIGNALS = [
  "coding-tool",
  "scam",
  "foreign",
  "cloud-host",
  "cjk-leak",
  "blank",
] as const;

export type ProbeSignal = (typeof PROBE_SIGNALS)[number] | null;
