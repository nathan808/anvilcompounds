// Display-only title suffixing — never apply this to the underlying product
// `name` used for cart items, WC order line items, slug/image/popularity
// lookups, or anything sent to WooCommerce. Titles only.

const NON_COMPOUND_CATEGORY = "Research Supplies"; // e.g. Bacteriostatic Water — not a peptide

export function isGlpCompound(name: string): boolean {
  return /^glp-/i.test(name.trim());
}

export function getProductDisplayTitle(name: string, category?: string): string {
  if (category === NON_COMPOUND_CATEGORY) return name;
  return isGlpCompound(name) ? `${name} Research Reagent` : `${name} Research Peptide`;
}
