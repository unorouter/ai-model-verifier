/**
 * Branches a live endpoint will not walk on demand: handshake precedence, the
 * transient escape, response mixing, an evidence finding beating a transient
 * ladder, the served-model and fingerprint rules, body extras, and runRules
 * asking for exactly the requests its rules need.
 */

import { describe, expect, test } from "bun:test";
import { runRules, verify } from "../../src/verify";
import type { TransportArgs, TransportFn } from "../../src/transport";

type Body = Record<string, unknown>;
const bodyOf = (a: TransportArgs) => a.reqBody as Body;
const promptOf = (b: Body) => {
  const msgs = b["messages"] as { content: unknown }[] | undefined;
  const last = msgs?.[msgs.length - 1]?.content;
  return typeof last === "string" ? last : "";
};
const nonceIn = (prompt: string) =>
  prompt.match(/\[([a-f0-9]{8})\]/)?.[1] ?? "";
const isHandshake = (b: Body) => promptOf(b) === "hi";
const isFixedText = (b: Body) =>
  promptOf(b).startsWith("Reply with exactly: ok");
const isFloor = (b: Body) => promptOf(b) === "Reply with only the word ok.";

/** A well behaved Anthropic-shaped endpoint; `answer` overrides a probe's text. */
function anthropicWire(opts: {
  model?: string;
  answer?: (prompt: string, nonce: string) => string | null;
  tokens?: { short: number; long: number };
}): TransportFn {
  return async (a) => {
    const b = bodyOf(a);
    const prompt = promptOf(b);
    const nonce = nonceIn(prompt);
    const reply = (text: string, input = 20, output = 30) => ({
      status: 200,
      data: {
        id: "msg_1",
        type: "message",
        model: opts.model ?? b["model"],
        content: [{ type: "text", text }],
        usage: { input_tokens: input, output_tokens: output },
      },
      error: null,
      corsBlocked: false,
    });
    if (isHandshake(b)) return reply("hi");
    if (isFixedText(b))
      return reply(
        "ok",
        prompt.length > 30
          ? (opts.tokens?.long ?? 110)
          : (opts.tokens?.short ?? 20),
        2,
      );
    const custom = opts.answer?.(prompt, nonce);
    if (custom === null)
      return { status: 503, data: null, error: null, corsBlocked: false };
    if (custom !== undefined) return reply(custom);
    if (prompt.includes("kitten"))
      return reply(
        `[${nonce}] a small kitten lost its way home in the cold rain and never found it again`,
      );
    if (prompt.includes("haiku"))
      return reply(
        `[${nonce}] golden light rising / waves whisper to the shore / a new day begins`,
      );
    if (prompt.includes("AI lab")) return reply(`[${nonce}] anthropic`);
    return reply(`[${nonce}] claude`);
  };
}

const base = {
  baseUrl: "https://relay.example.invalid",
  apiKey: "k",
  mode: "direct" as const,
};

describe("handshake", () => {
  test("a rejected model beats a bad key on the fallback wire", async () => {
    const transport: TransportFn = async (a) =>
      a.url.endsWith("/v1/messages")
        ? {
            status: 404,
            data: { error: { code: "model_not_found", message: "x" } },
            error: null,
            corsBlocked: false,
          }
        : { status: 403, data: null, error: null, corsBlocked: false };
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
    });
    expect(r.connectivityError).toBe("model-rejected");
    expect(r.verdict).toBe("unverified");
  });

  test("every wire busy is endpoint-busy, not no-format", async () => {
    const transport: TransportFn = async () => ({
      status: 503,
      data: null,
      error: null,
      corsBlocked: false,
    });
    const r = await verify({
      ...base,
      vendor: "gemini",
      model: "gemini-2.5-pro",
      transport,
    });
    expect(r.connectivityError).toBe("endpoint-busy");
  });

  test("falls back to the openai wire and reports it", async () => {
    const transport: TransportFn = async (a) =>
      a.url.endsWith("/v1/messages")
        ? {
            status: 400,
            data: { error: { message: "bad request" } },
            error: null,
            corsBlocked: false,
          }
        : anthropicWire({})(a);
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
    });
    expect(r.connectivityError).toBeNull();
    expect(r.resolvedVendor).toBe("openai");
  });
});

describe("probe ladder", () => {
  test("a clean lane is genuine and version-unverifiable", async () => {
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport: anthropicWire({}),
    });
    expect(r.verdict).toBe("genuine");
    expect(r.versionUnverifiable).toBe(true);
    expect(r.probesPassed).toBe(4);
    expect(r.responseMetadata?.shape).toBe("anthropic");
  });

  test("only transient shortfalls leave the lane unverified", async () => {
    const transport = anthropicWire({
      answer: (p) =>
        p.includes("kitten") || p.includes("haiku") ? null : undefined,
    });
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
    });
    expect(r.verdict).toBe("unverified");
    expect(r.reasons).toEqual(["transient: emotional, creative"]);
    expect(r.versionUnverifiable).toBe(false);
  });

  test("two probes that never echo the nonce read as response mixing", async () => {
    const transport = anthropicWire({
      answer: (p) =>
        p.includes("kitten") || p.includes("haiku") ? "" : undefined,
    });
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
    });
    expect(r.reasons).toEqual([
      "unsafe-proxy: response-mixing on emotional, creative",
    ]);
  });

  test("a foreign maker on the identity probe fails the lane", async () => {
    const transport = anthropicWire({
      answer: (p, n) => (p.includes("AI lab") ? `[${n}] openai` : undefined),
    });
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
    });
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons).toEqual(["foreign-identity: identity"]);
    expect(r.findings.map((f) => f.rule)).toContain("foreign");
  });

  test("the reply's model field naming another tier fails, a self-reported tier only notes", async () => {
    const served = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport: anthropicWire({ model: "claude-haiku-4-5" }),
    });
    expect(served.reasons[0]).toBe(
      "served-model-mismatch: requested claude-opus-4-6, response model claude-haiku-4-5",
    );

    const claimed = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport: anthropicWire({
        answer: (p, n) =>
          p.includes("Which model") ? `[${n}] claude sonnet` : undefined,
      }),
    });
    expect(claimed.verdict).toBe("genuine");
    expect(
      claimed.findings.find((f) => f.rule === "tier-self-report")?.reason,
    ).toBe("tier-self-report: claims sonnet");
  });

  test("all blank replies name the blank-response reason", async () => {
    const transport = anthropicWire({
      answer: (p, n) =>
        p.includes("AI lab") || p.includes("Which model")
          ? `[${n}]`
          : undefined,
    });
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
    });
    expect(r.reasons).toEqual(["failed: identity, model-name"]);
  });
});

describe("evidence rules", () => {
  test("a must-think model answering without thought beats a transient ladder", async () => {
    const transport: TransportFn = async (a) => {
      const b = bodyOf(a);
      if (isHandshake(b) || isFloor(b))
        return {
          status: 200,
          data: {
            model: "gemini-2.5-pro",
            choices: [{ message: { content: "ok" } }],
            usage: { prompt_tokens: 5, completion_tokens: 1 },
          },
          error: null,
          corsBlocked: false,
        };
      return { status: 503, data: null, error: null, corsBlocked: false };
    };
    const r = await verify({
      ...base,
      vendor: "openai",
      model: "gemini-2.5-pro",
      transport,
      checks: { thinkingFloor: true },
    });
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons).toEqual([
      "no-thinking: completion_tokens 1 below floor 10 with no reasoning tokens",
    ]);
    expect(r.versionUnverifiable).toBe(false);
    expect(r.thinkingFloor?.state).toBe("no-thinking");
  });

  test("a calibrated fingerprint naming a cheaper tier fails the lane", async () => {
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport: anthropicWire({ tokens: { short: 20, long: 110 } }),
      checks: { tokenizerFingerprint: { signatures: { haiku: [90] } } },
    });
    expect(r.tokenizerFingerprint?.delta).toBe(90);
    expect(r.reasons).toEqual([
      "tokenizer-fingerprint: delta 90 is the haiku signature, requested claude-opus-4-6",
    ]);
  });

  test("token truth reads the shared fixed text once", async () => {
    let fixed = 0;
    const inner = anthropicWire({});
    const transport: TransportFn = async (a) => {
      if (isFixedText(bodyOf(a)) && a.url.endsWith("/v1/messages")) fixed++;
      return inner(a);
    };
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
      checks: { tokenTruth: true, tokenizerFingerprint: true },
    });
    expect(fixed).toBe(2);
    expect(r.tokenTruth?.ok).toBe(true);
    expect(r.tokenizerFingerprint?.state).toBe("measured");
  });
});

describe("runRules", () => {
  test("body extras ride on every request and only the named rules run", async () => {
    const seen: Body[] = [];
    const inner = anthropicWire({});
    const transport: TransportFn = async (a) => {
      seen.push(bodyOf(a));
      return inner(a);
    };
    const run = await runRules({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport,
      bodyExtras: { provider: ["bedrock"] },
      only: ["tokenizer-fingerprint"],
    });
    expect(seen.length).toBe(2);
    expect(
      seen.every((b) => JSON.stringify(b["provider"]) === '["bedrock"]'),
    ).toBe(true);
    expect(run.probes).toEqual([]);
    expect(run.reports.tokenizerFingerprint?.delta).toBe(90);
  });

  test("the ladder on a known wire reports probes and findings without a handshake", async () => {
    const attempts: string[] = [];
    const run = await runRules({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport: anthropicWire({
        answer: (p, n) => (p.includes("AI lab") ? `[${n}] openai` : undefined),
      }),
      onProbe: (a) => attempts.push(`${a.label}:${a.pass}`),
      only: [
        "coding-tool",
        "scam",
        "cjk-leak",
        "mux",
        "foreign",
        "served-model-mismatch",
        "substituted",
        "quorum",
      ],
    });
    expect(run.probes.length).toBe(4);
    expect(run.findings.map((f) => `${f.rule}:${f.severity}`)).toEqual([
      "foreign:fail",
    ]);
    expect(attempts.sort()).toEqual([
      "creative:true",
      "emotional:true",
      "identity:false",
      "model-name:true",
    ]);
  });
});

/** The same well behaved endpoint answering in OpenAI shape. */
function openaiWire(opts: Parameters<typeof anthropicWire>[0]): TransportFn {
  const inner = anthropicWire(opts);
  return async (a) => {
    const r = await inner(a);
    const d = r.data as {
      model?: string;
      content?: { text: string }[];
      usage?: { input_tokens: number; output_tokens: number };
    } | null;
    if (!d) return r;
    return {
      ...r,
      data: {
        id: "chatcmpl-1",
        model: d.model,
        choices: [{ message: { content: d.content?.[0]?.text ?? "" } }],
        usage: {
          prompt_tokens: d.usage?.input_tokens,
          completion_tokens: d.usage?.output_tokens,
        },
      },
    };
  };
}

describe("identity follows the model, not the wire", () => {
  test("Claude naming its cloud host is home, not foreign", async () => {
    const r = await verify({
      ...base,
      vendor: "anthropic",
      model: "claude-opus-4-6",
      transport: anthropicWire({
        answer: (p, n) =>
          p.includes("AI lab")
            ? `[${n}] anthropic, hosted on google cloud vertex`
            : undefined,
      }),
    });
    expect(r.verdict).toBe("genuine");
    expect(r.probes.find((p) => p.label === "identity")?.signal).toBe(
      "cloud-host",
    );
  });

  test("Claude sold over the openai wire keeps Claude's vocabulary", async () => {
    const r = await verify({
      ...base,
      vendor: "openai",
      model: "claude-opus-4-6",
      transport: openaiWire({}),
    });
    expect(r.resolvedVendor).toBe("openai");
    expect(r.verdict).toBe("genuine");
    expect(r.findings.filter((f) => f.severity !== "note")).toEqual([]);
  });

  test("an unknown model on the openai wire is judged by that wire", async () => {
    const r = await verify({
      ...base,
      vendor: "openai",
      model: "mystery-7b",
      transport: openaiWire({}),
    });
    expect(r.reasons).toEqual(["foreign-identity: identity, model-name"]);
  });
});
