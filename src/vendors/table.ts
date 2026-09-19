import { anthropicVendor } from "./anthropic";
import { geminiVendor } from "./gemini";
import { openaiVendor } from "./openai";
import type { MakerId } from "../makers/table";
import type { VendorAdapter } from "./types";

export const VENDORS = [
  anthropicVendor,
  openaiVendor,
  geminiVendor,
] as const satisfies readonly VendorAdapter[];

export type VendorId = (typeof VENDORS)[number]["id"];

// A fallback wire that names no adapter is a typo; fail the build, not the run.
void (VENDORS satisfies readonly { fallbackWires: readonly VendorId[] }[]);
void (VENDORS satisfies readonly { defaultMaker: MakerId }[]);

export function vendorFor<V extends string>(
  vendors: readonly VendorAdapter<V>[],
  id: string,
): VendorAdapter<V> | undefined {
  return vendors.find((v) => v.id === id);
}
