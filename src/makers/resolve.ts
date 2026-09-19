import { CLOUD_HOST_PATTERNS } from "../identity/patterns";
import { globMatches, normalizeModelId } from "../models/facts";
import { MAKERS, makerFor, type MakerId } from "./table";
import type { Maker, ResolvedMaker } from "./types";

/** The maker with its foreign vocabulary: every other maker's words, minus cloud hosts and its own. */
export function resolveMaker<M extends string>(
  makers: readonly Maker<M>[],
  id: M,
): ResolvedMaker<M> {
  const maker = makerFor(makers, id);
  if (!maker) throw new TypeError(`unknown maker "${id}"`);
  const own = new Set([
    ...maker.home,
    ...maker.modelNames,
    ...(maker.cloudModelNames ?? []),
  ]);
  const foreign = new Set<string>();
  for (const other of makers) {
    if (other.id === maker.id) continue;
    for (const w of [...other.home, ...other.modelNames])
      if (!own.has(w) && !CLOUD_HOST_PATTERNS.includes(w)) foreign.add(w);
  }
  return {
    ...maker,
    cloudModelNames: maker.cloudModelNames ?? [],
    foreign: [...foreign],
  };
}

/** First maker whose glob names the model; null when the id names nothing the table knows. */
export function makerForModel(model: string): MakerId | null;
export function makerForModel<M extends string>(
  model: string,
  makers: readonly Maker<M>[],
): M | null;
export function makerForModel(
  model: string,
  makers: readonly Maker<string>[] = MAKERS,
): string | null {
  const id = normalizeModelId(model);
  for (const m of makers)
    if (m.models.some((p) => globMatches(id, p))) return m.id;
  return null;
}
