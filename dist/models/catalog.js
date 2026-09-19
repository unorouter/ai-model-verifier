import { MAKERS } from "../makers/table";
import { makerForModel } from "../makers/resolve";
import { VENDORS, vendorFor } from "../vendors/table";
/** Models the tester offers by default, per wire. */
export const CURATED_MODELS = {
    anthropic: [
        "claude-opus-4-6",
        "claude-opus-4-7",
        "claude-opus-4-8",
        "claude-sonnet-4-6",
        "claude-haiku-4-5",
    ],
    openai: ["gpt-5.5", "gpt-5.4", "gpt-5.1", "o3", "o4-mini"],
    gemini: ["gemini-3.1-pro-preview", "gemini-3.1-flash", "gemini-2.5-pro"],
};
export { makerForModel };
/** The wire a model's maker sells it on natively; null when the maker is unknown. */
export function wireForModel(model) {
    const maker = makerForModel(model);
    return MAKERS.find((m) => m.id === maker)?.wire ?? null;
}
/** Display vendor for a row: the model's maker when known, else the wire's name. */
export function vendorForRow(vendor, model) {
    return ((model ? makerForModel(model) : null) ??
        vendorFor(VENDORS, vendor)?.vendorName ??
        vendor);
}
//# sourceMappingURL=catalog.js.map