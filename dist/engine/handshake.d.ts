import type { ConnectivityError } from "../types";
import type { VendorAdapter } from "../vendors/types";
import { type RunCtx } from "./context";
export type HandshakeOutcome<V extends string> = {
    ok: true;
    wire: VendorAdapter<V>;
    status: number;
} | {
    ok: false;
    reason: ConnectivityError;
    status: number | null;
    corsBlocked: boolean;
};
/** The requested wire first, then its declared fallbacks, until one answers. */
export declare function runHandshake<V extends string>(ctx: RunCtx<V>, vendors: readonly VendorAdapter<V>[]): Promise<HandshakeOutcome<V>>;
//# sourceMappingURL=handshake.d.ts.map