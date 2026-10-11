export const CODING_TOOL_REFUSAL_PATTERNS = [
  "assist with development",
  "here to assist with development tasks",
  "sensitive, personal, or emotional",
  "i'm here to help with coding",
  "i'm here to help with development",
  "i'm designed to help with development",
  "let me help you with your code",
  "i'm a coding assistant",
  "development tasks, writing, analysis",
  "infrastructure and configuration",
  "falls outside what i can help with",
  "i'm focused on software development",
  "focused on software development and coding",
  "best suited for software development",
  "i'm built to help with software development",
  "i'm built to help with coding",
  "help with software development, coding",
  "what can i help you build",
  "got a tricky bug",
  "got a coding challenge",
  "got any code challenges",
  "i'm here to help with software",
  "i'm here for coding",
  "i'm droid",
  "development workflows, cli commands",
  "here to help with coding, development workflows",
];

/**
 * Matched on word boundaries: these are single common-ish words, and substring
 * matching condemned a real haiku ("golden light cascades" contains "cascade")
 * on an otherwise clean opus-4.8 lane. The refusal PHRASES stay substring
 * matched, being long enough not to collide.
 */
export const CODING_TOOL_NAMES = ["kiro", "cascade", "codeium"];

export const SCAM_PAGE_PATTERNS = [
  "token被盗",
  "token被人盗刷",
  "本站token",
  "盗取token",
  "微信jemes",
];

// prettier-ignore
export const CLOUD_HOST_PATTERNS = ["amazon","aws","bedrock","google","vertex","microsoft","azure","foundry"];

export const FAKE_RESPONSE_SIGNATURES = ["claude sonnet (4.0)"];

/**
 * Fragments of an injected system prompt a lane replays when asked to repeat
 * its instructions: the reseller wraps an IDE or agent session around the
 * model. A fact about the lane, never about the model.
 */
export const WRAPPER_SIGNATURES = [
  "antigravity",
  "accessed via an api",
  "mcp tools",
  "qoder",
  "cnb",
  "kiro",
  "windsurf",
  "cursor",
  "formatting notes for this conversation",
];

export const CJK_CHAR = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/g;

/** A couple of incidental glyphs (a quoted loanword) are tolerated. */
export const CJK_LEAK_MIN_CHARS = 4;

/**
 * A disguised model is coached to keep the backend quiet, and its own
 * reasoning repeats the coaching ("per gateway policy: answer only with the
 * declared public profile identity and never mention openai"). A hiding verb
 * aimed at a competitor or at the provider, plus a sign it was instructed.
 */
export const MASKING_VERB =
  /\b(?:never|don'?t|do not|must not|mustn'?t|should not|shouldn'?t|not to)\s+(?:mention|reveal|disclose|admit|acknowledge|discuss|bring up|refer to)\b/g;

export const MASKING_HIDDEN_BACKEND =
  /\b(?:hidden|underlying|real|actual|true|original|upstream)\s+(?:instructions?\s*\/\s*)?(?:model|provider|vendor|backend|origin)s?\b/;

export const MASKING_DECLARED_IDENTITY =
  /\b(?:declared|assigned|configured|public)\s+(?:public\s+)?(?:profile|persona)(?:\s+identity)?\b/;

export const MASKING_INSTRUCTED =
  /\b(?:policy|instructions?|system prompt|guidelines?|gateway|profile|persona|operator|configured|told to|i was told|i'?m told)\b/;

/**
 * A platform's own refusal or error page delivered as the model's reply at
 * HTTP 200, so a gateway bills it and never fails over. Measured on a7 lanes
 * on 2026-10-11: a Chinese input filter answering "系统检测到您当前输入的信息存在敏感内容"
 * for deepseek and glm, and a reseller returning its own "[req_...] [glm-5.3]
 * **request rejected by ai provider (http 400)**" page. Matched on lowercased
 * text; a model's own "i can't help with that" is not a platform line.
 */
export const PLATFORM_REFUSAL =
  /系统检测到|存在敏感内容|无法响应您的请求|请检查后重新输入|固定商家当前不可用|request rejected by (?:the )?ai provider|\[req_[0-9a-f]{6,}\]|upstream provider (?:rejected|refused)|blocked by (?:the )?(?:content|safety) (?:filter|policy)/;

/**
 * An instruction that tells the model who it is: "you are X", "你是「X」",
 * "your name is X". The capture is the identity it was given.
 */
export const IDENTITY_ASSIGNMENT =
  /(?:\byou are\b|\byour name is\b|\bact as\b|你是|你叫)\s*[「"'“]?([^\n。.,，」"'”]{1,60})/g;

/** An assignment that denies rather than assigns ("you are not claude"). */
export const NEGATED_ASSIGNMENT = /^(?:not|no longer|never|不是)\b/;

/** Agent and IDE products a relay wraps around the real model; reported by wrapper-leak, not a contradiction. */
export const WRAPPER_PRODUCTS = /\b(?:codex|claude code|cursor|kiro|antigravity|cline|copilot|windsurf|opencode|qoder|trae|droid)\b/;

/** A reply that refuses to replay instructions rather than replaying them. */
export const REPLAY_REFUSAL = /^\s*(?:\[[0-9a-f]{8}\]\s*)?i\s*(?:can.?t|cannot|won.?t|am not able|'m not able)\b/;
