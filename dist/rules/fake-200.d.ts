/**
 * A platform refusal or error page sent as the model's answer at HTTP 200. The
 * gateway in front of the lane bills it as a reply and never fails over, so a
 * user sees "unable to provide content" or the reseller's own error markup in
 * place of the model. Read from every answered probe and survey reply, so it
 * runs with the survey, whose sensitive question is the one that trips filters.
 */
export declare const fake200Rule: import("./types").Rule<"fake-200", "probes" | "survey", "evidence">;
//# sourceMappingURL=fake-200.d.ts.map