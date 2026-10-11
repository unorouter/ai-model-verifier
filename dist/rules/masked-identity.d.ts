/**
 * A lane serving one model under another's name injects a prompt telling it
 * to deny the backend. Coached replies pass every identity probe, but the
 * model's own reasoning restates the coaching, so the probes' reasoning (and
 * any reasoning leaked into the content) is searched for that instruction.
 */
export declare const maskedIdentityRule: import("./types").Rule<"masked-identity", "probes", "evidence">;
//# sourceMappingURL=masked-identity.d.ts.map