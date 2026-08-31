# @unorouter/verify-core

Authenticity and capability checks for AI API relays: given a `base_url`,
`api_key` and `model`, decide whether the endpoint really serves the Claude /
GPT / Gemini model it claims.

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
import { runVerification } from "@unorouter/verify-core";
import { anthropicConfig } from "@unorouter/verify-core/providers/anthropic";
```

## What it detects

`coding-tool` refusals (Kiro/Amazon Q wearing a Claude badge), scam pages,
CJK language leaks from a substituted Chinese model, response-mixing proxies,
foreign vendor identity, Claude tier substitution (opus billed, sonnet served),
and envelope-level model substitution.

## License

AGPL-3.0-only.
