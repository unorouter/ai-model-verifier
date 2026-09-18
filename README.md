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
import { createVerifier, defineRule, defineVendor, defineModelFacts } from "ai-model-verifier";

const { verify } = createVerifier({
  vendors: [defineVendor({ id: "mywire", ... })],
  rules: [defineRule({ id: "my-rule", layer: "probe", needs: ["probes"], applies: () => true, judge: async (ctx) => ... })],
  omit: ["substituted"],
  modelFacts: defineModelFacts([{ match: "my-model*", alwaysThinks: true }]),
});
```

## What it detects

Verdict rules, in precedence order: a must-think model answering with no
reasoning tokens (`thinking-floor`, opt-in); a tokenizer fingerprint matching a
cheaper tier under a caller-supplied calibration (`tokenizer-fingerprint`,
opt-in; ships no table, see the rule's note); `coding-tool` refusals (Kiro or
Amazon Q wearing a Claude badge); scam pages; CJK language leaks from a
substituted Chinese model; response-mixing proxies (`mux`); a foreign vendor
named as the maker; the reply's own `model` field naming another tier
(`served-model-mismatch`) or another model (`substituted`); and a probe quorum
that only fails on non-transient evidence.

Note rules report without judging: the Claude thinking signature, token
accounting against the billed usage, a self-reported tier, the response
envelope (which vendor's shape and id minted the reply) and throughput.

## Tests

`bun test` replays recordings made with the 1.4.1 build (`test/parity`) and a
set of synthetic endpoints. `test/parity/record.ts` records a new fixture.

## License

AGPL-3.0-only.
