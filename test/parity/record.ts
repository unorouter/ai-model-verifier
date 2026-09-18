/**
 * Record a fixture through the 1.4.1 build so 2.0 can be replayed against it.
 *
 *   OLD_VERIFIER=<dir with dist/> VERIFIER_KEY=<key> \
 *     bun test/parity/record.ts <name> <anthropic|openai|gemini> <baseUrl> <model>
 *
 * Every check is on. The key and the host are redacted before the fixture is
 * written; a response body that mentions the host is scrubbed the same way.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  fixtureKey,
  nonceOf,
  pathUnder,
  type Exchange,
  type Fixture,
} from "./replay";

const [name, provider, baseUrl, model] = process.argv.slice(2);
const oldDir = process.env["OLD_VERIFIER"];
const apiKey = process.env["VERIFIER_KEY"];
if (!name || !provider || !baseUrl || !model || !oldDir || !apiKey)
  throw new Error(
    "usage: OLD_VERIFIER=dir VERIFIER_KEY=key record.ts name provider baseUrl model",
  );

const REDACTED_BASE = `https://relay.example.invalid${new URL(baseUrl).pathname.replace(/\/+$/, "")}`;
const host = new URL(baseUrl).host;
const scrub = <T>(v: T): T =>
  JSON.parse(
    JSON.stringify(v)
      .replaceAll(host, "relay.example.invalid")
      .replaceAll(apiKey, "REDACTED"),
  );

const exchanges: Exchange[] = [];
const transport = async (args: {
  url: string;
  headers: Record<string, string>;
  reqBody: unknown;
  timeoutMs: number;
}) => {
  const path = pathUnder(args.url, baseUrl);
  let status: number | null = null;
  let data: unknown = null;
  let error: string | null = null;
  try {
    const res = await fetch(args.url, {
      method: "POST",
      headers: args.headers,
      body: JSON.stringify(args.reqBody),
      signal: AbortSignal.timeout(args.timeoutMs),
    });
    status = res.status;
    data = await res.json().catch(() => null);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  exchanges.push({
    key: fixtureKey(path, args.reqBody),
    path,
    nonce: nonceOf(args.reqBody),
    status,
    data: scrub(data),
    error,
  });
  process.stderr.write(`${path} ${status ?? error}\n`);
  return { status, data, error, corsBlocked: false };
};

const { runVerification } = await import(join(oldDir, "dist/runner.js"));
const expected = await runVerification({
  provider,
  baseUrl,
  apiKey,
  model,
  mode: "direct",
  transport,
  checkSignature: true,
  checkTokenTruth: true,
  checkThinkingFloor: true,
  checkTokenizerFingerprint: true,
});

const fixture: Fixture = {
  name,
  vendor: provider,
  model,
  baseUrl: REDACTED_BASE,
  exchanges,
  expected: scrub(expected),
};
const out = join(import.meta.dir, "fixtures", `${name}.json`);
writeFileSync(out, JSON.stringify(fixture, null, 1) + "\n");
process.stderr.write(
  `wrote ${out}: ${exchanges.length} exchanges, verdict ${expected.verdict} (${expected.reasons.join("; ")})\n`,
);
