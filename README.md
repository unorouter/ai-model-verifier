# ai-model-verifier

**Is that API endpoint really serving the model it claims?**

Resellers and relay stations sell "Claude Opus" or "GPT-5" and quietly serve
something cheaper. Given a `base_url`, `api_key` and `model`, this library
probes the endpoint and reports what it actually found: a substituted model, a
downgraded Claude tier, a stripped thinking signature, inflated token billing,
or a translation layer sitting in front of the real vendor.

Extracted from [unorouter](https://unorouter.com)'s model tester so the same
engine runs in the browser, on a server, and inside our sync pipeline.

## Design

- **Isomorphic.** Web-standard APIs only (`fetch`, `TextEncoder`,
  `AbortSignal`); no `node:` imports. The HTTP call itself is injected as a
  `TransportFn`, so a browser can route around CORS and a server can route
  through an SSRF-safe fetch.
- **Opt-in.** Providers and detectors have their own entry points, so a consumer
  that only checks Anthropic never bundles the Gemini config.
- **Zero required dependencies.**

## Use

```ts
import { runVerification } from "ai-model-verifier";
import { anthropicConfig } from "ai-model-verifier/providers/anthropic";
```

## What it detects

`coding-tool` refusals (Kiro/Amazon Q wearing a Claude badge), scam pages,
CJK language leaks from a substituted Chinese model, response-mixing proxies,
foreign vendor identity, Claude tier substitution (opus billed, sonnet served),
envelope-level model substitution, and (opt-in, `checkThinkingFloor`) a
model that cannot switch thinking off answering with no reasoning tokens, the
signature of a flash tier sold as Gemini 2.5 Pro, and (opt-in,
`checkTokenizerFingerprint`) the input-token delta for a fixed text, which no
system prompt can coach. Its job is drift: the delta is deterministic per
endpoint, so a lane whose delta moves between two measurements changed its
backend whatever the reply now calls itself. It does not name a tier on its
own (Opus 4.6, Sonnet 4.6 and Haiku 4.5 share a tokenizer, and relays count
differently from one another), so the signature table ships empty and is a
per-endpoint calibration the caller supplies.

## License

AGPL-3.0-only.
