export {
  MODEL_FACTS,
  defineModelFacts,
  globMatches,
  normalizeModelId,
  resolveModelFacts,
} from "./facts";
export type {
  FactsEntry,
  ModelFacts,
  ThinkingMode,
  TokenizerGeneration,
} from "./facts";
export {
  CURATED_MODELS,
  makerForModel,
  vendorForRow,
  wireForModel,
} from "./catalog";
export { detectSubstitution, modelsMatch } from "./substitution";
export { detectServedModelMismatch, detectTierMismatch, tierOf } from "./tiers";
