import { type MakerId } from "./table";
import type { Maker, ResolvedMaker } from "./types";
/** The maker with its foreign vocabulary: every other maker's words, minus cloud hosts and its own. */
export declare function resolveMaker<M extends string>(makers: readonly Maker<M>[], id: M): ResolvedMaker<M>;
/** First maker whose glob names the model; null when the id names nothing the table knows. */
export declare function makerForModel(model: string): MakerId | null;
export declare function makerForModel<M extends string>(model: string, makers: readonly Maker<M>[]): M | null;
//# sourceMappingURL=resolve.d.ts.map