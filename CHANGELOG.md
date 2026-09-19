# Changelog

## 3.0.1

- Gemini 2.5 and 3.x get reasoning room over the OpenAI wire
  (`max_completion_tokens` 2000): the probes' small caps were spent on hidden
  thought and a few characters of visible reply failed every probe.
- New maker `writer` (Palmyra), so a Palmyra answering under another label
  reads as foreign.

## 3.0.0

Makers split from wires. A maker is who trained the model; a wire is how the
endpoint sells it. The identity vocabulary, tiers and CJK tolerance now come
from the model's maker (`src/makers/table.ts`), so a DeepSeek, MiniMax, Kimi,
GLM, Qwen, MiMo, Mistral, Llama, Grok or Hunyuan sold over an OpenAI-shaped
relay is judged by its own words and can be `genuine`. 2.x borrowed the wire's
vocabulary and condemned every one of them.

Breaking:

- `VendorAdapter.identity` and `.tiers` are gone; every wire names a
  `defaultMaker`, used only for a model the tables do not know.
- `ModelFacts.vendor` is `maker` (a `MakerId`: `google`, not `gemini`).
  Consumer `modelFacts` entries rename `vendor:` to `maker:`.
- `vendorForModel` is gone: `wireForModel` gives the wire a model is natively
  sold on (what a format check wants), `makerForModel` the maker.
  `vendorForRow` returns the maker id when known, else the wire's name.
- `highlightSpans(text, makerId, probe)` takes the result's `maker`; a wire id
  still works and stands for its default maker.
- `ProbeDef.grade` takes a `ResolvedMaker`; `VendorIdentity` is removed.
- Maker vocabulary matches on word boundaries: "meta" no longer hits
  "metadata", "o3" still hits "o3-mini".
- `cjk-leak` does not apply to makers that train on Chinese (`cjkNative`).

New: `VerifyResult.maker`, the `./makers` entry point, `MAKERS`, `defineMaker`,
`makerForModel`, `resolveMaker`, and `createVerifier({ makers })`.

## 2.0.3

- A 2xx that is no chat reply fails the handshake the way a 4xx does. Hosts
  that answer every path with 200 (webhook.site, httpbin, an app's HTML
  fallback) now end as `no-format` instead of being probed and scored
  suspicious.
- A probe answered with an error body at 200 counts as no answer, like a
  non-2xx: a run whose probes only got error bodies is `unverified`, not
  `suspicious`.

## 2.0.2

- "google" alone no longer marks a foreign maker: Claude on Vertex answers
  "Anthropic, hosted on Google Cloud", which the cloud host list accepts. A
  Google model still names DeepMind or Gemini.

## 2.0.1

- The identity vocabulary and tier list come from the model's own vendor,
  falling back to the wire only for a model the tables do not know. 2.0.0
  read them from the wire, so a genuine Claude sold over an OpenAI-shaped relay
  answered "anthropic" and was rejected as foreign.

## 2.0.0

Architectural overhaul, no new detections. Every check from 1.4 still runs with
the same prompts and tolerances; what changed is where things live and how a
consumer extends them.

- Vendor adapters (`src/vendors/`): one object per wire with `ops.chat`,
  `ops.countTokens`, readers and identity vocabulary. No rule builds a request.
- Model facts (`src/models/facts.ts`): one glob table for thinking mode,
  tokenizer generation, always-thinks, reasoning output floor and vendor.
- Rules (`src/rules/`): every detection is a rule over a shared evidence bag;
  the table order is the verdict precedence. The four probes stay data.
- `verify`, `runRules`, `createVerifier` and `defineVendor`, `defineRule`,
  `defineModelFacts` replace `runVerification`.

Breaking:

- `provider` and `resolvedProvider` are `vendor` and `resolvedVendor`;
  `checkSignature` and friends are `checks: { signature, tokenTruth,
  thinkingFloor, tokenizerFingerprint }`; results carry `findings`.
- Subpath exports are `./vendors`, `./rules`, `./models`, `./transport` and
  `./highlight`; the `./*` wildcard is gone.
- The browser transport no longer assumes `/api/models/verify/probe`; pass
  `serverProxyUrl` (or a `transport`) in server mode.
- `DETECTION_RULES` now lists the verdict rules: `thinking-floor`,
  `tokenizer-fingerprint`, `coding-tool`, `scam`, `cjk-leak`, `mux`, `foreign`,
  `served-model-mismatch`, `substituted`, `quorum`. `tier-mismatch` is the note
  rule `tier-self-report`: what a model calls itself is coachable, so it no
  longer decides a verdict. `served-model-mismatch` (the reply's own `model`
  field names another tier) is new here, ported from the sync pipeline.
- Rules honour the run's transport mode and send the Anthropic browser header on
  direct runs; header names are lowercase; the OpenAI wire sends
  `max_completion_tokens` only for reasoning models and `max_tokens` otherwise.
- Coding-tool names match on word boundaries; any transport error is transient.
- Model ids are normalised with any `vendor/` or `pool/` prefix stripped, so
  `openai/gpt-5` resolves to openai and `pool/claude-opus-4-6` keeps its facts.
