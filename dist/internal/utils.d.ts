export declare function isRecord(v: unknown): v is Record<string, unknown>;
export declare function rec(v: unknown): Record<string, unknown> | undefined;
export declare function isOneOf<const T extends readonly unknown[]>(values: T): (v: unknown) => v is T[number];
export declare function errMessage(err: unknown): string;
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map