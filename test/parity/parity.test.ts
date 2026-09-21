import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verify } from "../../src/verify";
import type { VendorId } from "../../src/vendors/table";
import { replayTransport, type Fixture } from "./replay";

type OldProbe = {
  label: string;
  pass: boolean;
  signal: string | null;
  muxFailure: boolean;
  transient: boolean;
  reason: string | null;
  detectedModel: string | null;
  usage: unknown;
};

type OldResult = {
  verdict: string;
  reasons: string[];
  versionUnverifiable: boolean;
  probes: OldProbe[];
  detectedModel: string | null;
  resolvedProvider: string;
  probesPassed: number;
  connectivityError: string | null;
  signature?: { state: string };
  tokenTruth?: { checks: unknown; ok: boolean | null };
  thinkingFloor?: { state: string };
  tokenizerFingerprint?: { delta: number | null; state: string };
  responseMetadata?: { notes: string[] };
  throughput?: { tokensPerSecond: number } | null;
};

/** Reason prefixes whose text 2.0 keeps byte for byte. */
const STABLE_REASONS = [
  "coding-tool-refusal:",
  "scam-page:",
  "cjk-language-leak:",
  "unsafe-proxy:",
  "foreign-identity:",
  "failed:",
  "transient:",
  "no-thinking:",
  "tokenizer-fingerprint:",
];

const dir = join(import.meta.dir, "fixtures");
const fixtures = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f): Fixture => JSON.parse(readFileSync(join(dir, f), "utf8")));

describe("parity with 1.4.1 recordings", () => {
  for (const fixture of fixtures) {
    test(fixture.name, async () => {
      const recorded = fixture.expected as OldResult;
      const o = fixture.overrides;
      const old: OldResult = {
        ...recorded,
        ...(o?.verdict !== undefined ? { verdict: o.verdict } : {}),
        ...(o?.versionUnverifiable !== undefined
          ? { versionUnverifiable: o.versionUnverifiable }
          : {}),
        ...(o?.reasons !== undefined ? { reasons: o.reasons } : {}),
        ...(o?.probesPassed !== undefined
          ? { probesPassed: o.probesPassed }
          : {}),
        probes: recorded.probes.map((p) => ({ ...p, ...o?.probes?.[p.label] })),
      };
      const result = await verify({
        vendor: fixture.vendor as VendorId,
        baseUrl: fixture.baseUrl,
        apiKey: "REDACTED",
        model: fixture.model,
        mode: "direct",
        transport: replayTransport(fixture),
        checks: {
          signature: true,
          tokenTruth: true,
          thinkingFloor: true,
          tokenizerFingerprint: true,
        },
      });

      expect(result.connectivityError).toBe(old.connectivityError);
      expect(result.resolvedVendor).toBe(old.resolvedProvider);
      expect(result.detectedModel).toBe(old.detectedModel);
      expect(result.probesPassed).toBe(old.probesPassed);
      expect(
        result.probes.map((p) => ({
          label: p.label,
          pass: p.pass,
          signal: p.signal,
          muxFailure: p.muxFailure,
          transient: p.transient,
          reason: p.reason,
          detectedModel: p.detectedModel,
          usage: p.usage,
        })),
      ).toEqual(
        old.probes.map((p) => ({
          label: p.label,
          pass: p.pass,
          signal: p.signal,
          muxFailure: p.muxFailure,
          transient: p.transient,
          reason: p.reason,
          detectedModel: p.detectedModel,
          usage: p.usage,
        })),
      );

      // The one deliberate verdict change: a self-reported tier is a note now.
      const oldReason = old.reasons[0] ?? "";
      if (!oldReason.startsWith("tier-mismatch:")) {
        expect(result.verdict).toBe(old.verdict);
        expect(result.versionUnverifiable).toBe(old.versionUnverifiable);
        if (o?.reasons || STABLE_REASONS.some((p) => oldReason.startsWith(p)))
          expect(result.reasons).toEqual(old.reasons);
      }

      expect(result.signature?.state).toBe(old.signature?.state);
      expect(result.tokenTruth?.ok).toBe(old.tokenTruth?.ok);
      expect(result.tokenTruth?.checks).toEqual(old.tokenTruth?.checks);
      expect(result.thinkingFloor?.state).toBe(old.thinkingFloor?.state);
      // 3.4 measures the tokenizer on every maker; a recording made when only
      // Claude was measured has no fixed text for the others, so the rule
      // reports unmeasured there.
      if (old.tokenizerFingerprint) {
        expect(result.tokenizerFingerprint?.state).toBe(
          old.tokenizerFingerprint.state,
        );
        expect(result.tokenizerFingerprint?.delta).toBe(
          old.tokenizerFingerprint.delta,
        );
      } else {
        expect(result.tokenizerFingerprint?.state).toBe("unmeasured");
      }
      expect(result.responseMetadata?.notes).toEqual(
        old.responseMetadata?.notes,
      );
      // Throughput is tokens over wall time; a replay answers in microseconds.
    });
  }
});
