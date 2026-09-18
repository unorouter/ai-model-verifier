import { VENDORS, vendorFor, type VendorId } from "../vendors/table";
import { resolveModelFacts } from "./facts";

/** Models the tester offers by default, per wire. */
export const CURATED_MODELS: Record<VendorId, readonly string[]> = {
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

export function vendorForModel(model: string): VendorId | null {
  return resolveModelFacts(model).vendor;
}

/** Display vendor for a row: the model's maker when known, else the wire's. */
export function vendorForRow(vendor: VendorId, model?: string): string {
  const id = (model ? vendorForModel(model) : null) ?? vendor;
  return vendorFor(VENDORS, id)?.vendorName ?? id;
}
