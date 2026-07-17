// Display-only title suffixing — never apply this to the underlying product
// `name` used for cart items, WC order line items, slug/image/popularity
// lookups, or anything sent to WooCommerce. Titles only.

const NON_COMPOUND_CATEGORY = "Research Supplies"; // e.g. Bacteriostatic Water — not a peptide

// Products whose chemical class isn't a peptide get their own suffix instead
// of the generic "Research Peptide".
const TITLE_OVERRIDES: Record<string, string> = {
  "NAD+":         "NAD+ Research Coenzyme",
  "5-Amino-1MQ":  "5-Amino-1MQ Research Molecule",
};

export function isGlpCompound(name: string): boolean {
  return /^glp-/i.test(name.trim());
}

export function getProductDisplayTitle(name: string, category?: string): string {
  if (category === NON_COMPOUND_CATEGORY) return name;
  if (TITLE_OVERRIDES[name]) return TITLE_OVERRIDES[name];
  return isGlpCompound(name) ? `${name} Research Reagent` : `${name} Research Peptide`;
}
