// Display names for WooCommerce categories. WC remains the system of record
// for the underlying category (and its slug); these are the labels the
// storefront shows, named by research area / compound class rather than by
// any implied end use. A category not listed here is shown as-is.
const CATEGORY_DISPLAY: Record<string, string> = {
  "Repair & Recovery Research":    "Cell Migration Research",
  "Metabolic Research":            "Metabolic Pathway Research",
  "Cognitive Research":            "Neuropeptide Research",
  "Longevity & Cosmetic Research": "Extracellular Matrix Research",
  "Growth Pathway Research":       "GHRH & Secretagogue Research",
  "Blends":                        "Multi-Component Blends",
  "Research Supplies":             "Laboratory Supplies",
};

export function displayCategory(name: string): string {
  return CATEGORY_DISPLAY[name] ?? name;
}

// Category filter order on the catalog page (display names).
export const CATEGORY_ORDER = [
  "All Compounds",
  "Cell Migration Research",
  "Metabolic Pathway Research",
  "Neuropeptide Research",
  "Extracellular Matrix Research",
  "GHRH & Secretagogue Research",
  "Multi-Component Blends",
  "Laboratory Supplies",
];

export const SUPPLIES_CATEGORY = "Laboratory Supplies";
