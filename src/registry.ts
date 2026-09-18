import type { FactsEntry } from "./models/facts";
import { RULES, type RuleId } from "./rules/table";
import type { Rule } from "./rules/types";
import type { RuleRun, VerifyOptions, VerifyResult } from "./types";
import { VENDORS, type VendorId } from "./vendors/table";
import type { VendorAdapter } from "./vendors/types";
import { runRulesWith, verifyWith, type Registry } from "./verify";

/**
 * A verifier with the built-in tables plus the caller's own vendors, rules and
 * model facts. Consumer rules run after the built-ins (so they never outrank
 * them); `omit` drops built-ins a consumer replaces or disagrees with; consumer
 * model facts are consulted before the table.
 */
export function createVerifier<
  V extends string = never,
  R extends string = never,
>(cfg: {
  vendors?: readonly VendorAdapter<V>[];
  rules?: readonly Rule<R>[];
  omit?: readonly RuleId[];
  modelFacts?: readonly FactsEntry[];
}) {
  const omit = new Set<string>(cfg.omit ?? []);
  const registry: Registry<VendorId | V, RuleId | R> = {
    vendors: [...VENDORS, ...(cfg.vendors ?? [])],
    rules: [...RULES.filter((r) => !omit.has(r.id)), ...(cfg.rules ?? [])],
    facts: cfg.modelFacts ?? [],
  };
  return {
    registry,
    verify: (
      opts: VerifyOptions<VendorId | V>,
    ): Promise<VerifyResult<VendorId | V, RuleId | R>> =>
      verifyWith(registry, opts),
    runRules: (
      opts: VerifyOptions<VendorId | V> & { only: readonly (RuleId | R)[] },
    ): Promise<RuleRun<RuleId | R>> => runRulesWith(registry, opts),
  };
}
