export type TransportMode = "direct" | "server";
export type TransportResult = {
    status: number | null;
    data: unknown;
    error: string | null;
    corsBlocked: boolean;
};
export type TransportArgs = {
    mode: TransportMode;
    url: string;
    headers: Record<string, string>;
    reqBody: unknown;
    timeoutMs: number;
};
export type TransportFn = (args: TransportArgs) => Promise<TransportResult>;
/** Plain fetch from wherever the code runs. */
export declare const directTransport: TransportFn;
/**
 * From a browser through the caller's own backend, which forwards
 * `{ url, headers, reqBody }` and answers `{ data: { status, data } }`.
 */
export declare function browserTransport(opts: {
    serverProxyUrl: string;
}): TransportFn;
//# sourceMappingURL=transport.d.ts.map