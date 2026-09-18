export declare function isRecord(v: unknown): v is Record<string, unknown>;
export declare function rec(v: unknown): Record<string, unknown> | undefined;
export declare function errMessage(err: unknown): string;
export declare function sleep(ms: number): Promise<void>;
/** Rejects booleans and floats: usage counts are whole tokens or nothing. */
export declare function intOf(v: unknown): number | null;
export declare function hostOf(url: string): string;
//# sourceMappingURL=utils.d.ts.map