export function isRecord(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
}
export function rec(v) {
    return isRecord(v) ? v : undefined;
}
export function errMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
export function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
/** Rejects booleans and floats: usage counts are whole tokens or nothing. */
export function intOf(v) {
    return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;
}
export function hostOf(url) {
    try {
        return new URL(url).host;
    }
    catch {
        return url;
    }
}
//# sourceMappingURL=utils.js.map