// Vendored from unorouter's src/lib/utils/base.ts so the package stays
// dependency-free. Four helpers, copied verbatim; keep them in step if the
// originals change.
export function isRecord(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
}
export function rec(v) {
    return isRecord(v) ? v : undefined;
}
export function isOneOf(values) {
    return (v) => values.some((x) => x === v);
}
export function errMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
export function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=utils.js.map