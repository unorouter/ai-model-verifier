import { MAKERS } from "./makers/table";
import { RULES } from "./rules/table";
import { VENDORS } from "./vendors/table";
import { runRulesWith, verifyWith } from "./verify";
/**
 * A verifier with the built-in tables plus the caller's own vendors, makers,
 * rules and model facts. Consumer rules run after the built-ins (so they never
 * outrank them); `omit` drops built-ins a consumer replaces or disagrees with;
 * consumer model facts and makers are consulted before the tables.
 */
export function createVerifier(cfg) {
    const omit = new Set(cfg.omit ?? []);
    const registry = {
        vendors: [...VENDORS, ...(cfg.vendors ?? [])],
        makers: [...(cfg.makers ?? []), ...MAKERS],
        rules: [...RULES.filter((r) => !omit.has(r.id)), ...(cfg.rules ?? [])],
        facts: cfg.modelFacts ?? [],
    };
    return {
        registry,
        verify: (opts) => verifyWith(registry, opts),
        runRules: (opts) => runRulesWith(registry, opts),
    };
}
//# sourceMappingURL=registry.js.map