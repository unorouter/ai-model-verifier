# Changelog

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
