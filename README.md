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
and envelope-level model substitution.

## License

AGPL-3.0-only.
