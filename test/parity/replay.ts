/**
 * Recorded exchanges keyed on what the endpoint saw: the path under the base
 * URL and the conversation, with nonces and output caps normalised so a 2.0
 * request finds the 1.4.1 recording of the same probe.
 */

import type { TransportFn } from "../../src/transport";

export type Exchange = {
  key: string;
  path: string;
  /** Nonce the recorded prompt carried, so the reply can echo the new one. */
  nonce: string | null;
  status: number | null;
  data: unknown;
  error: string | null;
};

export type Fixture = {
  name: string;
  vendor: string;
  model: string;
  /** Redacted; only the path under it matters. */
  baseUrl: string;
  exchanges: Exchange[];
  expected: unknown;
  /** Where a later major deliberately judges the same exchanges differently. */
  overrides?: {
    note: string;
    verdict?: string;
    versionUnverifiable?: boolean;
    reasons?: string[];
    probesPassed?: number;
    probes?: Record<
      string,
      { pass?: boolean; signal?: string | null; reason?: string | null }
    >;
  };
};

export const NONCE_RE = /\[([a-f0-9]{8})\]/;

export function pathUnder(url: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return url.startsWith(base) ? url.slice(base.length) : new URL(url).pathname;
}

export function nonceOf(body: unknown): string | null {
  const m = JSON.stringify(body).match(NONCE_RE);
  return m ? m[1]! : null;
}

export function fixtureKey(path: string, body: unknown): string {
  const b = body as Record<string, unknown>;
  const conversation = JSON.stringify(
    b?.["messages"] ?? b?.["contents"] ?? null,
  ).replace(/\[[a-f0-9]{8}\]/g, "[NONCE]");
  const thinking = b?.["thinking"] ? JSON.stringify(b["thinking"]) : "";
  return `${path} ${conversation} ${thinking}`;
}

export function replayTransport(fixture: Fixture): TransportFn {
  const used = new Set<Exchange>();
  return async (args) => {
    const key = fixtureKey(pathUnder(args.url, fixture.baseUrl), args.reqBody);
    const hits = fixture.exchanges.filter((e) => e.key === key);
    if (hits.length === 0)
      throw new Error(`no recording for ${key.slice(0, 160)}`);
    const ex = hits.find((e) => !used.has(e)) ?? hits[hits.length - 1]!;
    used.add(ex);
    const nonce = nonceOf(args.reqBody);
    const data =
      ex.nonce && nonce && ex.data !== null
        ? JSON.parse(JSON.stringify(ex.data).replaceAll(ex.nonce, nonce))
        : ex.data;
    return { status: ex.status, data, error: ex.error, corsBlocked: false };
  };
}
