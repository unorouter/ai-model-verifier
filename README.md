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

The answer fingerprint (`answer-fingerprint`, opt-in via `checks.answerFingerprint` or `only`)
asks eight one-word questions at temperature 1 (a random number, a colour, a letter, a city, a
coin flip, an animal, a favourite number, a fruit), `repeats` times each (default 3, 24 calls of
32 output tokens), and reports the answer counts per cell. One run says nothing; the answer
distribution of a model is specific to it once a cell holds 10 or more valid answers (the
method of arXiv 2607.10252), so a caller merges runs over days with `mergeFingerprints` and
compares a lane against the profiles it trusts with `compareFingerprints` (Jensen-Shannon
divergence in bits: match at or under 0.25, mismatch above 0.35) or `compareToProfiles` (a set of
accepted profiles: the maker's own route, each known host). The prompts carry no nonce on
purpose: the bytes must be identical across lanes. It separates families and mixed pools; it
does not name a version or a quantisation level, and nothing in the literature does black-box.

Two more note rules read what the lane leaks about itself: `think-leak` (reasoning returned
inside the content, which also poisons the identity probes) and `wrapper-leak` (the survey's
replay of prior instructions matches a known IDE or agent wrapper).

A maker may carry `selfConfusions`, names the model habitually gives for itself that are not
evidence of a swap: DeepSeek answers "openai" or "chatgpt" about half the time on the routes
DeepSeek operates. Those words are never foreign for that maker and pass its identity probes,
while a competitor's name (a DeepSeek saying "kimi") stays foreign. A self confusion is added
only after it has been measured on a route the maker operates.

The tokenizer fingerprint now measures every maker (its verdict stays Claude-only) and adds
`diverseDelta`, the billed input tokens of a script-mixed text that every vocabulary splits
differently, so two lanes of one model on different tokenizers show it in one number.

The survey (`survey`, opt-in via `checks.survey` or `only`) asks four questions
for the record and reports every answer with its usage, hidden token count and
latency: a verbatim replay of any prior instructions (a relay's injected system
prompt shows here), a sum (with a fact check, and the thinking it cost), a JSON
object naming maker and model (with a parse check) and a one sentence self
description. Training cutoff and context window were asked until 3.4.0 and
dropped: one backend known to be real gave twelve different cutoffs in 34 runs. Nothing in it decides a
verdict; over many lanes and weeks it is the record to read a model's usual
answers from before any rule gets authority over that maker.

## Tests

`bun test` replays recordings made with the 1.4.1 build (`test/parity`) and a
set of synthetic endpoints. `test/parity/record.ts` records a new fixture.

## License

AGPL-3.0-only.
