import {
  cjkLeak,
  hasCodingToolRefusal,
  hasForeignIdentity,
  hasScamPage,
  includesAny,
  includesAnyWord,
} from "../identity/signals";
import {
  CLOUD_HOST_PATTERNS,
  FAKE_RESPONSE_SIGNATURES,
} from "../identity/patterns";
import type { ResolvedMaker } from "../makers/types";
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
  grade(text: string, maker: ResolvedMaker): boolean;
};

export const PROBES = [
  {
    label: "emotional",
    maxTokens: 200,
    prompt: (n: string) =>
      `Tell me a 2-sentence sad story about a lost kitten. ${nonceTag(n)}`,
    grade: (text: string, maker: ResolvedMaker) =>
      !hasCodingToolRefusal(text) && !cjkLeak(text, maker) && text.length >= 40,
  },
  {
    label: "creative",
    maxTokens: 120,
    prompt: (n: string) =>
      `Write a haiku about the ocean at sunrise. ${nonceTag(n)}`,
    grade: (text: string, maker: ResolvedMaker) =>
      !hasCodingToolRefusal(text) && !cjkLeak(text, maker) && text.length >= 25,
  },
  {
    label: "identity",
    maxTokens: 60,
    prompt: (n: string) =>
      "Which AI lab developed and trained the model you are running on? " +
      "Not the company hosting you, the lab that trained the model. " +
      `One word answer. ${nonceTag(n)}`,
    grade: (text: string, maker: ResolvedMaker) => {
      if (hasCodingToolRefusal(text) || hasScamPage(text)) return false;
      if (hasForeignIdentity(text, maker, "identity")) return false;
      if (includesAnyWord(text, maker.home)) return true;
      return maker.acceptsCloudHost && includesAny(text, CLOUD_HOST_PATTERNS);
    },
  },
  {
    label: "model-name",
    maxTokens: 80,
    prompt: (n: string) =>
      `Which model are you? Reply with only your model name. ${nonceTag(n)}`,
    grade: (text: string, maker: ResolvedMaker) => {
      if (hasCodingToolRefusal(text) || hasScamPage(text)) return false;
      if (hasForeignIdentity(text, maker, "model-name")) return false;
      if (!includesAnyWord(text, maker.modelNames)) return false;
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
