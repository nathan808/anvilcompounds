// Display-only title suffixing — never apply this to the underlying product
// `name` used for cart items, WC order line items, slug/image/popularity
// lookups, or anything sent to WooCommerce. Titles only.

// Categories whose products aren't a single peptide, so the generic
// "Research Peptide" suffix doesn't apply: Research Supplies (e.g.
// Bacteriostatic Water) and Research Bundles (multiple products co-shipped,
// already named things like "Energy Research Bundle").
const NON_COMPOUND_CATEGORIES = new Set(["Research Supplies", "Research Bundles"]);

// Products whose chemical class isn't a peptide get their own suffix instead
// of the generic "Research Peptide".
const TITLE_OVERRIDES: Record<string, string> = {
  "NAD+":         "NAD+ Research Coenzyme",
  "5-Amino-1MQ":  "5-Amino-1MQ Research Molecule",
};

// GLP_COMPOUND_NAMES: explicit allowlist rather than a pure "^glp-" prefix
// test, since the Aug 2026 rename moved these two off GLP-prefixed names
// entirely (WC product `name` is now literally "AC3R"/"AC2T" — see
// lib/woocommerce.ts). Old names kept here too in case any cached/stale WC
// response still has them, matching this codebase's established
// keep-every-historical-alias convention (see SLUG_MAP, PRODUCT_BADGES, etc.).
const GLP_COMPOUND_NAMES = new Set(["AC3R", "AC2T", "GLP-RT", "GLP-TRZ"]);

export function isGlpCompound(name: string): boolean {
  return GLP_COMPOUND_NAMES.has(name.trim()) || /^glp-/i.test(name.trim());
}

// The real compound behind a coded product name — shown as a small animated
// reveal under/next to the product name (see components/CompoundRevealBadge.tsx)
// so a rename doesn't obscure what's actually in the vial.
const COMPOUND_REVEAL: Record<string, string> = {
  "AC3R":    "Retatrutide",
  "AC2T":    "Tirzepatide",
  "GLP-RT":  "Retatrutide",
  "GLP-TRZ": "Tirzepatide",
};

export function getCompoundReveal(name: string): string | null {
  return COMPOUND_REVEAL[name] ?? null;
}

export function getProductDisplayTitle(name: string, category?: string): string {
  if (category && NON_COMPOUND_CATEGORIES.has(category)) return name;
  if (TITLE_OVERRIDES[name]) return TITLE_OVERRIDES[name];
  return isGlpCompound(name) ? `${name} Research Reagent` : `${name} Research Peptide`;
}
