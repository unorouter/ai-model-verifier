const VERSION_SUFFIX = /\/(?:v\d+(?:alpha|beta)?)\/*$/i;

/** Adapters append their own version segment, so a pasted one would double it. */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "").replace(VERSION_SUFFIX, "");
}
