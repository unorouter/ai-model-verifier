// Vendored from unorouter's src/lib/utils/base.ts so the package stays
// dependency-free. Four helpers, copied verbatim; keep them in step if the
// originals change.

export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function rec(v: unknown): Record<string, unknown> | undefined {
  return isRecord(v) ? v : undefined;
}

export function isOneOf<const T extends readonly unknown[]>(
  values: T,
): (v: unknown) => v is T[number] {
  return (v): v is T[number] => values.some((x) => x === v);
}

export function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
