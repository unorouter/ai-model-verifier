import { MAKERS, type MakerId } from "./makers/table";
import type { Maker } from "./makers/types";
import type { FactsEntry } from "./models/facts";
import { RULES, type RuleId } from "./rules/table";
import type { Rule } from "./rules/types";
import type { RuleRun, VerifyOptions, VerifyResult } from "./types";
import { VENDORS, type VendorId } from "./vendors/table";
import type { VendorAdapter } from "./vendors/types";
import { runRulesWith, verifyWith, type Registry } from "./verify";

/**
 * A verifier with the built-in tables plus the caller's own vendors, makers,
 * rules and model facts. Consumer rules run after the built-ins (so they never
 * outrank them); `omit` drops built-ins a consumer replaces or disagrees with;
 * consumer model facts and makers are consulted before the tables.
 */
export function createVerifier<
  V extends string = never,
  R extends string = never,
  M extends string = never,
>(cfg: {
  vendors?: readonly VendorAdapter<V>[];
  makers?: readonly Maker<M>[];
  rules?: readonly Rule<R>[];
  omit?: readonly RuleId[];
  modelFacts?: readonly FactsEntry<MakerId | M>[];
}) {
  const omit = new Set<string>(cfg.omit ?? []);
  const registry: Registry<VendorId | V, RuleId | R, MakerId | M> = {
    vendors: [...VENDORS, ...(cfg.vendors ?? [])],
    makers: [...(cfg.makers ?? []), ...MAKERS],
    rules: [...RULES.filter((r) => !omit.has(r.id)), ...(cfg.rules ?? [])],
    facts: cfg.modelFacts ?? [],
  };
  return {
    registry,
    verify: (
      opts: VerifyOptions<VendorId | V>,
    ): Promise<VerifyResult<VendorId | V, RuleId | R, MakerId | M>> =>
      verifyWith(registry, opts),
    runRules: (
      opts: VerifyOptions<VendorId | V> & { only: readonly (RuleId | R)[] },
    ): Promise<RuleRun<RuleId | R>> => runRulesWith(registry, opts),
  };
}
