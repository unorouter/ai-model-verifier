# ai-model-verifier

**Is that API endpoint really serving the model it claims?**

Resellers and relay stations sell "Claude Opus" or "GPT-5" and quietly serve
something cheaper. Given a `baseUrl`, `apiKey` and `model`, this library
probes the endpoint and reports what it actually found: a substituted model, a
downgraded Claude tier, a stripped thinking signature, inflated token billing,
or a translation layer sitting in front of the real vendor.

Extracted from [unorouter](https://unorouter.com)'s model tester so the same
engine runs in the browser, on a server, and inside our sync pipeline.

## Design

- **Adapters.** One object per wire format (`anthropic`, `openai`, `gemini`)
  builds every request and reads every reply. Rules never see a URL.
- **Makers.** Who trained a model is separate from how it is sold. A maker
  table (Anthropic, OpenAI, Google, DeepSeek, Moonshot, Zhipu, MiniMax, Xiaomi,
  Mistral, Alibaba, Meta, xAI, Tencent) carries the words a genuine model uses
  for itself, its tiers and whether Chinese in a reply is a tell; the model id
  picks the maker, the wire only shapes the request. A DeepSeek sold over an
  OpenAI-shaped relay is judged as a DeepSeek.
- **Rules over evidence.** Every detection is a rule that declares the
  evidence it needs (the four behavioural probes, a fixed-text pair, a thinking
  reply, a floor reply). Evidence is collected once per run and shared; the
  rule table's order is the verdict's precedence.
- **Model facts.** One glob table says which models think adaptively, which
  tokenizer generation they bill with, which cannot switch reasoning off.
- **Isomorphic.** Web-standard APIs only, no `node:` imports. The HTTP call is
  an injected `TransportFn`, so a browser can route through its backend and a
  server through an SSRF-safe fetch.
- **Zero required dependencies.**

## Install

```sh
npm i ai-model-verifier
```

## Use

```ts
import { verify } from "ai-model-verifier";

const result = await verify({
  vendor: "anthropic",
  baseUrl: "https://relay.example.com",
  apiKey: process.env.RELAY_KEY!,
  model: "claude-opus-4-6",
  mode: "direct",
  checks: { signature: true, tokenTruth: true, tokenizerFingerprint: true },
});
console.log(result.verdict, result.reasons, result.findings);
```

`runRules` judges chosen rules on a wire you already know works, without a
handshake, and is what a pipeline with its own connectivity probes wants:

```ts
import { runRules } from "ai-model-verifier";

const run = await runRules({
  vendor: "openai",
  baseUrl,
  apiKey,
  model: "pool/claude-opus-4-6",
  mode: "server",
  transport: myFetch,
  bodyExtras: { provider: ["bedrock"] },
  only: ["coding-tool", "foreign", "served-model-mismatch", "quorum", "tokenizer-fingerprint"],
});
for (const f of run.findings) console.log(f.rule, f.severity, f.reason);
```

Extend without forking:

```ts
import { createVerifier, defineMaker, defineRule, defineVendor, defineModelFacts } from "ai-model-verifier";

const { verify } = createVerifier({
  vendors: [defineVendor({ id: "mywire", ... })],
  makers: [defineMaker({ id: "acme", name: "Acme", wire: "openai", models: ["acme-*"], home: ["acme"], modelNames: ["acme"], acceptsCloudHost: false, tiers: null, cjkNative: false })],
  rules: [defineRule({ id: "my-rule", layer: "probe", needs: ["probes"], applies: () => true, judge: async (ctx) => ... })],
  omit: ["substituted"],
  modelFacts: defineModelFacts([{ match: "hy4-*", maker: "tencent" }, { match: "my-model*", alwaysThinks: true }]),
});
```

## What it detects

Verdict rules, in precedence order: a must-think model answering with no
reasoning tokens (`thinking-floor`, opt-in); a tokenizer fingerprint matching a
cheaper tier under a caller-supplied calibration (`tokenizer-fingerprint`,
opt-in; ships no table, see the rule's note); `coding-tool` refusals (Kiro or
Amazon Q wearing a Claude badge); scam pages; CJK language leaks from a
substituted Chinese model (skipped for makers that train on Chinese);
response-mixing proxies (`mux`); another maker named as the maker, judged by the
requested model's own maker rather than the wire; the reply's own `model` field naming another tier
(`served-model-mismatch`) or another model (`substituted`); and a probe quorum
that only fails on non-transient evidence.

A model whose id names no maker is judged by the wire's default maker, and a
model that only says "I am an AI assistant" fails the identity probe, which the
quorum tolerates when the other three pass.

Note rules report without judging: the Claude thinking signature, token
accounting against the billed usage, a self-reported tier, the response
envelope (which vendor's shape and id minted the reply), throughput and the
survey.

The survey (`survey`, opt-in via `checks.survey` or `only`) asks six questions
for the record and reports every answer with its usage, hidden token count and
latency: training cutoff, context window, a verbatim replay of any prior
instructions (a relay's injected system prompt shows here), a sum (with a fact
check, and the thinking it cost), a JSON object naming maker and model (with a
parse check) and a one sentence self description. Nothing in it decides a
verdict; over many lanes and weeks it is the record to read a model's usual
answers from before any rule gets authority over that maker.

## Tests

`bun test` replays recordings made with the 1.4.1 build (`test/parity`) and a
set of synthetic endpoints. `test/parity/record.ts` records a new fixture.

## License

AGPL-3.0-only.
