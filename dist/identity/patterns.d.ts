export declare const CODING_TOOL_REFUSAL_PATTERNS: string[];
/**
 * Matched on word boundaries: these are single common-ish words, and substring
 * matching condemned a real haiku ("golden light cascades" contains "cascade")
 * on an otherwise clean opus-4.8 lane. The refusal PHRASES stay substring
 * matched, being long enough not to collide.
 */
export declare const CODING_TOOL_NAMES: string[];
export declare const SCAM_PAGE_PATTERNS: string[];
export declare const CLOUD_HOST_PATTERNS: string[];
export declare const FAKE_RESPONSE_SIGNATURES: string[];
/**
 * Fragments of an injected system prompt a lane replays when asked to repeat
 * its instructions: the reseller wraps an IDE or agent session around the
 * model. A fact about the lane, never about the model.
 */
export declare const WRAPPER_SIGNATURES: string[];
export declare const CJK_CHAR: RegExp;
/** A couple of incidental glyphs (a quoted loanword) are tolerated. */
export declare const CJK_LEAK_MIN_CHARS = 4;
//# sourceMappingURL=patterns.d.ts.map