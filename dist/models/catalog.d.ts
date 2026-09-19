import { makerForModel } from "../makers/resolve";
import { type VendorId } from "../vendors/table";
/** Models the tester offers by default, per wire. */
export declare const CURATED_MODELS: Record<VendorId, readonly string[]>;
export { makerForModel };
/** The wire a model's maker sells it on natively; null when the maker is unknown. */
export declare function wireForModel(model: string): VendorId | null;
/** Display vendor for a row: the model's maker when known, else the wire's name. */
export declare function vendorForRow(vendor: VendorId, model?: string): string;
//# sourceMappingURL=catalog.d.ts.map