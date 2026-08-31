import type { TransportMode } from "./types";
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
export declare function probeTransport(args: TransportArgs): Promise<TransportResult>;
//# sourceMappingURL=transport.d.ts.map