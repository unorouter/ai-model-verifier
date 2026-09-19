import { CLOUD_HOST_PATTERNS } from "../identity/patterns";
import { globMatches, normalizeModelId } from "../models/facts";
import { MAKERS, makerFor } from "./table";
/** The maker with its foreign vocabulary: every other maker's words, minus cloud hosts and its own. */
export function resolveMaker(makers, id) {
    const maker = makerFor(makers, id);
    if (!maker)
        throw new TypeError(`unknown maker "${id}"`);
    const own = new Set([
        ...maker.home,
        ...maker.modelNames,
        ...(maker.cloudModelNames ?? []),
    ]);
    const foreign = new Set();
    for (const other of makers) {
        if (other.id === maker.id)
            continue;
        for (const w of [...other.home, ...other.modelNames])
            if (!own.has(w) && !CLOUD_HOST_PATTERNS.includes(w))
                foreign.add(w);
    }
    return {
        ...maker,
        cloudModelNames: maker.cloudModelNames ?? [],
        foreign: [...foreign],
    };
}
export function makerForModel(model, makers = MAKERS) {
    const id = normalizeModelId(model);
    for (const m of makers)
        if (m.models.some((p) => globMatches(id, p)))
            return m.id;
    return null;
}
//# sourceMappingURL=resolve.js.map