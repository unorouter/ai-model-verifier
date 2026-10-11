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
