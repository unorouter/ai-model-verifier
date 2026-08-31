import { type TransportFn } from "./transport";
import type { TransportMode, VerifyProvider } from "./types";
export type HandshakeOutcome = {
    ok: true;
    resolvedProvider: VerifyProvider;
    mode: TransportMode;
    status: number;
} | {
    ok: false;
    reason: "cors-needs-backend" | "unreachable" | "invalid-key" | "no-format";
    status: number | null;
    corsBlocked: boolean;
};
export declare function runHandshake(opts: {
    provider: VerifyProvider;
    baseUrl: string;
    apiKey: string;
    model: string;
    mode: TransportMode;
    timeoutMs: number;
    transport?: TransportFn;
}): Promise<HandshakeOutcome>;
//# sourceMappingURL=handshake.d.ts.map