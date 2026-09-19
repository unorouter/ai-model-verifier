import type { EnvelopeShape } from "./types";
export declare const ANTHROPIC_USAGE: Set<string>;
export declare const OPENAI_USAGE: Set<string>;
export declare const GEMINI_USAGE: Set<string>;
/** Shape a reply body matches, regardless of which API was called. */
export declare function envelopeShapeOf(data: unknown): EnvelopeShape;
//# sourceMappingURL=shape.d.ts.map