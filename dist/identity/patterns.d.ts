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
/**
 * A disguised model is coached to keep the backend quiet, and its own
 * reasoning repeats the coaching ("per gateway policy: answer only with the
 * declared public profile identity and never mention openai"). A hiding verb
 * aimed at a competitor or at the provider, plus a sign it was instructed.
 */
export declare const MASKING_VERB: RegExp;
export declare const MASKING_HIDDEN_BACKEND: RegExp;
export declare const MASKING_DECLARED_IDENTITY: RegExp;
export declare const MASKING_INSTRUCTED: RegExp;
/**
 * A platform's own refusal or error page delivered as the model's reply at
 * HTTP 200, so a gateway bills it and never fails over. Measured on a7 lanes
 * on 2026-10-11: a Chinese input filter answering "系统检测到您当前输入的信息存在敏感内容"
 * for deepseek and glm, and a reseller returning its own "[req_...] [glm-5.3]
 * **request rejected by ai provider (http 400)**" page. Matched on lowercased
 * text; a model's own "i can't help with that" is not a platform line.
 */
export declare const PLATFORM_REFUSAL: RegExp;
/**
 * An instruction that tells the model who it is: "you are X", "你是「X」",
 * "your name is X". The capture is the identity it was given.
 */
export declare const IDENTITY_ASSIGNMENT: RegExp;
/** An assignment that denies rather than assigns ("you are not claude"). */
export declare const NEGATED_ASSIGNMENT: RegExp;
/** Agent and IDE products a relay wraps around the real model; reported by wrapper-leak, not a contradiction. */
export declare const WRAPPER_PRODUCTS: RegExp;
/** A reply that refuses to replay instructions rather than replaying them. */
export declare const REPLAY_REFUSAL: RegExp;
//# sourceMappingURL=patterns.d.ts.map