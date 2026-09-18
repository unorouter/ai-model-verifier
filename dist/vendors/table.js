import { anthropicVendor } from "./anthropic";
import { geminiVendor } from "./gemini";
import { openaiVendor } from "./openai";
export const VENDORS = [
    anthropicVendor,
    openaiVendor,
    geminiVendor,
];
// A fallback wire that names no adapter is a typo; fail the build, not the run.
void VENDORS;
export function vendorFor(vendors, id) {
    return vendors.find((v) => v.id === id);
}
//# sourceMappingURL=table.js.map