# Changelog

## 3.9.10

- New rule `censored-history` (evidence, fail): a lane claiming an
  Anthropic, OpenAI, Google or xAI model that refuses or claims not to know
  what happened at Tiananmen Square in June 1989. Over 25 days of logs every
  clean Google, xAI and OpenAI lane answered, and 338 of 347 Claude lanes; the
  nine Claude lanes that did not were already billing impossible token counts.
  A platform filter's own line stays `fake-200`, and a refusal of the nonce or
  format instruction is not counted.
- `tokenizer-family`: a single run billed below every known tokenizer fails.
  3.9.6 left one such run inconclusive as a possible relay cache; the a7
  merchants that showed it refuse the Tiananmen question like Chinese models.

## 3.9.9

- Anthropic wire: the prompt count is `input_tokens` plus
  `cache_read_input_tokens` and `cache_creation_input_tokens`. `input_tokens`
  alone leaves the cached part out, so a caching lane (gg's Claude, 64 to 193
  tokens read from cache per run) billed the script runs 0 to 16 and failed
  `tokenizer-family` as made up usage.

## 3.9.8

- `tokenizer-family`: the Chinese script run is sent twice more, each copy
  behind its own nonce at the start so no prefix or answer cache can tell
  them apart. Billed more than double apart (and over ten tokens) fails as
  made up usage: a real tokenizer bills identical text identically.
  wusrouter's "claude-opus-5.5" billed the copies 126 and 29. The bound is
  loose on purpose, since a router may serve the copies through a provider
  that counts and one that estimates (151 against 101). Real Claude on ih and
  si still bills 101/151/100/149 and passes.

## 3.9.7

- Script count runs go one at a time and wait out a busy answer (5s, 20s,
  40s), long enough for a per minute window. wusrouter allows 15 requests a
  minute per key and a full run sends about 17, so its count runs always
  answered 429 and the vocabulary was never measured.

## 3.9.6

- `tokenizer-family`: a script run billed below a third of the leanest known
  family on that run (its full prompt count, anchor included) is impossible
  for any tokenizer. Two such runs fail as made up usage; one is inconclusive,
  since a7 Claude merchants bill the repeated digits run at 1 to 4 now and
  then, which reads as a relay cache. wusrouter's "claude-fable-5.1-free"
  billed 1 for 300 digits and 8 for the Chinese run and passed as genuine.
- `tokenizer-family`: when a count run times out or the endpoint is busy, the
  result is inconclusive for a maker with known vectors instead of silent, so
  a run without a measured vocabulary no longer reads as genuine.
- Script count runs retry once on a transient answer.

## 3.9.5

- Handshake: a transient answer (429, 5xx, timeout) on the requested wire is
  retried twice before falling back to the next wire. One busy moment on
  LinkAPI's native Gemini route moved Vertex Argon onto its OpenAI route,
  which drops `reasoning_effort`, and the lane failed `thinking-honored`.

## 3.9.4

- OpenAI wire `reasoningUsage`: when no reasoning count is reported but
  `total_tokens` exceeds prompt plus completion, the difference counts as
  thinking. Google's OpenAI-compatible endpoint reports thoughts only there
  (Gemini 3.6 Flash at high effort: 40 prompt, 4 completion, 374 total).
- `thinking-honored`: a reply with no thought count anywhere and a short
  completion is `unmeasured`, not `ignored`. Sellers that recompute usage as
  prompt plus answer (si) hid real Gemini's thinking, so every Google-backed
  Argon seller read as ignoring effort.

## 3.9.3

- `thinking-honored`: when the high-effort reply carries Google's thought
  signature (`carriesThoughtSignature`), too little thought is reported as
  `inconclusive` (`thinking-locked`) instead of `fail`. That reply came from
  Gemini itself, so the seller capped reasoning; another model behind a persona
  prompt carries no signature and still fails. gg's cheap Argon group billed 8
  thought tokens at high effort with signed replies.

## 3.9.2

- `tokenizer-family` also fails when every run bills about one token per four
  characters (new state `char-estimated`, `isCharacterEstimate`). No tokenizer
  bills Chinese that lean, so the provider is making up usage and hiding the
  backend's real counts; UTIM's "gemini-4-argon" billed 80/32/50/92 under a
  hidden persona prompt that passed every identity probe.

## 3.9.1

- `TOKENIZER_FAMILIES`: Kimi's published tokenizer bills the DeepSeek vector
  (101/61/101/120), so that entry names moonshot too and a Kimi lane on it
  passes as its own family. New `qwen3.8` entry (301/61/100/149): Qwen 3.8
  changed vocabulary, measured on three merchants.

## 3.9.0

- New verdict rule `tokenizer-family` (opt-in with `tokenizerFamily`). It bills
  one anchor prompt and four runs appended to it (digits, Chinese, spaces,
  indented code; `SCRIPT_VARIANTS`) and reads the four input-token deltas as a
  vector, which names the vocabulary behind the endpoint where one English run
  cannot. `TOKENIZER_FAMILIES` holds the vectors: open families from each
  maker's published tokenizer, Gemini and five Claude relay paths measured on
  lanes passing every other rule. It fails only when the claimed maker has known
  vectors, the measured one matches none of them, and it matches another
  family that relays do not estimate with (OpenAI's two are marked
  `estimator`). A Radox lane sold as `claude-fable-5.1` passed the identity
  probes on most keys under a hidden persona prompt but billed 101/80/101/120,
  the Llama 4 vocabulary Meta's Muse Spark uses (Grok 4.3 bills the same, so
  that entry names both makers); every Claude path bills 135 or more on the
  Chinese run.
- `matchTokenizerFamilies`, `knowsMaker` and `judgeTokenizerFamily` are
  exported for callers that measure on their own.

## 3.8.0

- New verdict rule `thinking-honored` (opt-in with `thinkingFloor`) for models
  that think only when asked, marked by the new model fact `thinksWhenAsked`
  (`gemini-4*`). It asks a small reasoning question at high effort
  (`reasoning_effort` on the OpenAI wire, `thinkingConfig.thinkingLevel` with
  `includeThoughts` on Gemini's) and fails a reply carrying fewer than
  `MIN_ASKED_THINKING_TOKENS` (100) thought tokens: reasoning tokens when
  reported, else the completion count. Google spent 304 to 360 on it; a7
  merchants selling Gemini 4 answered with 0 or 47 to 59, and users saw short,
  flat replies there.
- `ChatRequest.reasoningEffort` asks a wire for its highest reasoning effort.
- `gemini-4*` gets the 2000 token output floor the other Gemini thinkers have.

## 3.7.1

- `modelsMatch` also tolerates a relay's route tag on the requested id
  (`[free]deepseek-v4.1-flash` against `deepseek-ai/deepseek-v4.1-flash`) and
  Kimi spelled without its `k` (`kimi-k2.7-code` against `kimi-2.7`, echoed by
  seven a7 lanes). Every other substitution seen in three weeks of runs still
  mismatches (SenseNova, MiniMax, `auto` and `codely-basic` behind deepseek,
  qwen and glm names; `gpt-oss-20b` behind `gpt-5-mini`).

## 3.7.0

- Every probe and survey reply records `finishReason` (as the wire spells it:
  `stop`, `length`, `end_turn`, `STOP`) and the probes record `reasoning`
  (hidden and visible output counts), so a lane that never thinks or that cuts
  answers short shows up in the probe log, not only in the survey.
  `ProbeMeta.finishReason` is read on all three wires.
- A refused request keeps its body (`errorBody`, capped at 500 characters) on
  probes and survey replies: why it was refused is the evidence, not just the
  status.
- Survey question `sensitive`: a historical question that Chinese input filters
  block.
- `fake-200` (evidence, runs with the survey): a platform refusal or a
  reseller's error page delivered as the reply at HTTP 200. Over three weeks of
  stored runs it matched 4 lanes, all real ("[req_...] **ai provider
  temporarily unavailable**"), and nothing else.
- `mask-contradiction` (note): the instruction replay assigns another maker's
  identity. A note because those replays were single runs in 20 to 57, a model
  reciting a remembered prompt.
- `alwaysThinks` for glm-5.3, kimi-k2.6, k2.7 and k3, deepseek-v4-pro,
  deepseek-v4.1-flash and qwen3.8-flash, from survey replies on their honest
  routes; deepseek-v4-flash, glm-5.2, minimax and mimo answered without thought
  there and stay out.
- NVIDIA carries `selfConfusions` openai, gpt, chatgpt: Nemotron replays "you
  are chatgpt" on NVIDIA's own NIM accounts.

## 3.6.0

- `masked-identity` (evidence): the probes' reasoning (and any reasoning leaked
  into the content) restates an instruction to hide the backend.
- Reasoning text is read on every wire (`read.reasoningText`).

## 3.5.0

- The answer fingerprint keeps `checks.answerFingerprint.concurrency` calls in
  flight per lane (default 4) instead of running all 24 in a row: on a
  reasoning model the sequential battery took a median of 105 s and up to
  460 s per lane, four times the rest of the ladder. `concurrency: 1` restores
  the old pacing.

## 3.4.0

- Answer fingerprint (`answer-fingerprint`, note layer, `checks.answerFingerprint`
  or `only`): eight one-word questions at temperature 1, `repeats` per cell,
  reported as answer counts. Pure helpers `mergeFingerprints`, `jensenShannon`,
  `compareFingerprints`, `compareToProfiles` and `fingerprintClusters` let a
  caller accumulate runs and compare a lane against accepted profiles with the
  thresholds of arXiv 2607.10252 (0.25 match, 0.35 mismatch bits, 10 valid
  answers per cell). `FINGERPRINT_CELLS`, `classifyAnswer`, `stripThink`
  exported. All 24 calls run sequentially.
- `ChatRequest` gains `temperature`, `topP` and `seed`; the OpenAI and Gemini
  adapters send them, Anthropic sends temperature only and never next to
  thinking.
- `Maker.selfConfusions`: names a model gives itself that are not a swap.
  DeepSeek carries `openai, gpt, chatgpt, anthropic, claude`, measured on the
  routes DeepSeek operates; those words are neither foreign nor a failed
  identity probe for it, and a competitor's name still is.
- Note rules `think-leak` (reasoning inside the content) and `wrapper-leak`
  (the survey's instruction replay names a known IDE or agent wrapper,
  `WRAPPER_SIGNATURES`).
- The tokenizer fingerprint measures every maker over the OpenAI and Anthropic
  wires (verdict still Claude-only) and reports `diverseDelta`, the billed
  tokens of a new script-mixed `DIVERSE_PROMPT`; the fixed text now costs three
  calls.
- Survey: `cutoff` and `context-window` dropped (noise on a known backend).
- `ProbeAttempt.label` also names a fingerprint cell.

## 3.3.0

- Twenty eight more makers (Cohere, ByteDance, Baidu, StepFun, NVIDIA, IBM,
  Liquid, Kwaipilot, Meituan, inclusionAI, Shanghai AI Lab, OpenBMB,
  SenseTime, rednote, Perplexity, Microsoft, Amazon, AI21, Nous, Poolside,
  Swiss AI, Inception, Arcee, Nex AGI, Sarvam, SCB 10X, Moondream, JetBrains,
  Aion, Venice) and wider globs for the existing ones, so relay spellings
  (`coding-glm-5.3-free`, `e2ee-qwen3-6-35b-a3b`, `morph-kimik3`,
  `xiaomi-mimo-v2-5`, `tencent/hy4-preview`, `openai-gpt-oss-120b`,
  `kiro-auto`, `antigravity-*`, `nano-banana-*`) resolve. Measured over the
  1,421 model ids of three marketplaces, a gateway and a verdict cache: 1,203
  resolve, and what is left is media models and one-off finetunes.
- Character classes never worked in a glob (`*` is the only wildcard); the
  table no longer uses them.

## 3.2.0

- Survey questions (`survey` rule, note layer, `checks.survey` under `verify`
  or named in `only` under `runRules`): six questions asked beside the ladder
  and reported as answered, never judged. Training cutoff, context window, a
  verbatim replay of any prior instructions (a relay's injected system prompt),
  a sum with a fact check and the hidden token count it cost, a JSON object
  naming maker and model with a parse check, and a one sentence self
  description. `reports.survey` carries text, nonce echo, usage, reasoning
  usage, latency, `detectedModel` and `correct`. `SURVEY` is exported;
  `ProbeAttempt.label` now also names a survey question.

## 3.1.0

- Gemini 3 Pro and 3.1 Pro always think, like 2.5 Pro: the `thinking-floor`
  rule now judges them, so a pro label answering "ok" with no hidden tokens
  is `no-thinking`. Two such lanes were found by hand tonight; one answered
  "42" to a sum after 32 seconds.

## 3.0.2

- The open-weight thinkers (GLM 5, Kimi k2.6 and up, DeepSeek v4, MiniMax
  m2.5 and up, MiMo, Qwen 3.8, Hunyuan 4) get the same 2000 token room as
  Gemini, sent as a raised `max_tokens` because their relays do not know
  `max_completion_tokens`; OpenAI and Google keep `max_completion_tokens`.
- Google gets the tier words `pro` and `flash`, so a flash served under a pro
  label is a `served-model-mismatch` and a self-report note.

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
