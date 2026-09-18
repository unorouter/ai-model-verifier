import { type VendorId } from "../vendors/table";
/** Models the tester offers by default, per wire. */
export declare const CURATED_MODELS: Record<VendorId, readonly string[]>;
export declare function vendorForModel(model: string): VendorId | null;
/** Display vendor for a row: the model's maker when known, else the wire's. */
export declare function vendorForRow(vendor: VendorId, model?: string): string;
//# sourceMappingURL=catalog.d.ts.map