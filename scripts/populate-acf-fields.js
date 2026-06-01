#!/usr/bin/env node
/**
 * Anvil Compounds — ACF Field Population Script
 *
 * Writes product content to WooCommerce product meta_data
 * in ACF's internal repeater format so fields appear correctly
 * in WP admin (once ACF is installed and field group imported).
 *
 * Run: node scripts/populate-acf-fields.js
 * Requires: WC API key with Read/Write access (already updated)
 */

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
(function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) { console.error("ERROR: .env.local not found"); process.exit(1); }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
})();

const WC_URL = (process.env.WC_URL || "").replace(/\/$/, "");
const AUTH   = "Basic " + Buffer.from(
  (process.env.WC_CONSUMER_KEY || "") + ":" + (process.env.WC_CONSUMER_SECRET || "")
).toString("base64");

if (!WC_URL) { console.error("ERROR: WC_URL missing in .env.local"); process.exit(1); }

// ---------------------------------------------------------------------------
// WC API helpers
// ---------------------------------------------------------------------------
async function wcJson(endpoint, opts = {}) {
  const res = await fetch(WC_URL + "/wp-json/wc/v3" + endpoint, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: AUTH, ...(opts.headers || {}) },
  });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) throw Object.assign(new Error(json.message || `HTTP ${res.status}`), { status: res.status, json });
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// ACF meta builder
// ---------------------------------------------------------------------------
/**
 * Build a flat meta_data array that represents ACF's internal storage format.
 * ACF stores repeaters as:
 *   field_name            = row_count
 *   _field_name           = field_key         ← ACF field reference
 *   field_name_0_subfield = value
 *   _field_name_0_subfield = subfield_key     ← ACF sub-field reference
 *   ...etc
 */
function buildAcfMeta(product) {
  const meta = [];

  const add = (key, value, fieldKey) => {
    meta.push({ key, value });
    if (fieldKey) meta.push({ key: `_${key}`, value: fieldKey });
  };

  // ── Simple scalar fields ───────────────────────────────────────────────
  add("subtitle",                   product.subtitle,                   "field_anvil_subtitle");
  add("what_it_is_subtitle",        product.whatItIsSubtitle,           "field_anvil_what_it_is_subtitle");
  add("what_it_is_body",            product.whatItIsBody,               "field_anvil_what_it_is_body");
  add("documentation_section_heading", product.documentationHeading,    "field_anvil_documentation_heading");
  add("documentation_caption",      product.documentationCaption || "", "field_anvil_documentation_caption");
  add("shipping_type",              product.shippingType,               "field_anvil_shipping_type");

  if (product.compositionBody) {
    add("composition_body", product.compositionBody, "field_anvil_composition_body");
  }

  // ── trust_badges (repeater: sub_field = badge) ─────────────────────────
  const badges = product.trustBadges;
  add("trust_badges", String(badges.length), "field_anvil_trust_badges");
  badges.forEach((b, i) => {
    add(`trust_badges_${i}_badge`, b, "field_anvil_trust_badge_text");
  });

  // ── research_applications (repeater: sub_field = application) ──────────
  const apps = product.researchApplications;
  add("research_applications", String(apps.length), "field_anvil_research_applications");
  apps.forEach((a, i) => {
    add(`research_applications_${i}_application`, a, "field_anvil_research_application_text");
  });

  // ── documentation_metrics (repeater: sub_fields = label, value) ─────────
  const metrics = product.documentationMetrics;
  add("documentation_metrics", String(metrics.length), "field_anvil_documentation_metrics");
  metrics.forEach(({ label, value }, i) => {
    add(`documentation_metrics_${i}_label`, label, "field_anvil_doc_metric_label");
    add(`documentation_metrics_${i}_value`, value, "field_anvil_doc_metric_value");
  });

  // ── properties_table (repeater: sub_fields = label, value) ─────────────
  const props = product.propertiesTable;
  add("properties_table", String(props.length), "field_anvil_properties_table");
  props.forEach(({ label, value }, i) => {
    add(`properties_table_${i}_label`, label, "field_anvil_prop_label");
    add(`properties_table_${i}_value`, value, "field_anvil_prop_value");
  });

  return meta;
}

// ---------------------------------------------------------------------------
// Populate a single WC product (handles existing meta ID lookup to avoid dupes)
// ---------------------------------------------------------------------------
async function populateProduct(wcId, productData, label) {
  console.log(`\n[${label}] Fetching current meta...`);
  const current = await wcJson(`/products/${wcId}`);
  await sleep(300);

  // Build key → id map from existing meta_data
  const existingIdMap = {};
  for (const m of (current.meta_data || [])) {
    existingIdMap[m.key] = m.id;
  }

  const newMeta = buildAcfMeta(productData);

  // Attach existing IDs so WC updates rather than duplicates
  const metaWithIds = newMeta.map((m) =>
    existingIdMap[m.key] !== undefined
      ? { id: existingIdMap[m.key], key: m.key, value: m.value }
      : m
  );

  console.log(`[${label}] Writing ${newMeta.length} meta entries...`);
  await wcJson(`/products/${wcId}`, {
    method: "PUT",
    body: JSON.stringify({ meta_data: metaWithIds }),
  });
  await sleep(500);

  console.log(`[${label}] ✓ Done`);
  return { label, wcId, fields: newMeta.filter((m) => !m.key.startsWith("_")).length };
}

// ---------------------------------------------------------------------------
// Product content (sourced from WordPress Pages + lib/productData.ts)
// ---------------------------------------------------------------------------
const PEPTIDE_TRUST_BADGES = ["99%+ purity", "Endotoxin screened", "COA verified", "Same-day shipping"];
const PEPTIDE_METRICS = [
  { label: "Purity",    value: "Testing in progress" },
  { label: "Identity",  value: "Testing in progress" },
  { label: "Endotoxin", value: "Testing in progress" },
  { label: "Lot ID",    value: "Pending — first batch" },
];
const DOC_CAPTION_PEPTIDE =
  "COA issued by accredited independent third-party laboratory. Verification link confirms results were not self-reported by Anvil Compounds.";
const DOC_HEADING = "Documentation & Quality";

const PRODUCTS = [
  {
    wcId: 332,
    label: "BPC-157",
    subtitle:            "Pentadecapeptide fragment · Lyophilized · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "BPC-157 | Research Use Only",
    whatItIsBody:        "BPC-157, also written as Body Protection Compound-157, is a synthetic pentadecapeptide derived from a partial sequence of a protective protein found in gastric juice. In scientific literature it is classified as a stable gastric pentadecapeptide and is studied as a tool compound in receptor and signaling research across gastrointestinal, connective tissue, and angiogenesis models.",
    compositionBody:     "BPC-157 is a 15-amino acid peptide with the molecular formula C62H98N16O22 and a molecular weight of approximately 1419.56 g/mol. It is synthesized via standard solid-phase peptide synthesis (SPPS) and supplied in lyophilized form for stability.",
    researchApplications: [
      "Gastrointestinal mucosal signaling research",
      "Connective tissue and tendon cell biology models",
      "Angiogenesis and vascular signaling pathway studies",
      "Nitric oxide system modulation research",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  DOC_CAPTION_PEPTIDE,
    propertiesTable: [
      { label: "CAS Number",        value: "137525-51-0" },
      { label: "Molecular Formula", value: "C62H98N16O22" },
      { label: "Molecular Weight",  value: "1419.56 g/mol" },
      { label: "Appearance",        value: "White to off-white lyophilized powder" },
      { label: "Sequence",          value: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val" },
      { label: "Storage",           value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",        value: "24 months from manufacture date" },
      { label: "Vial Format",       value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",             value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 334,
    label: "Semaglutide",
    subtitle:            "GLP-1 receptor agonist · Lyophilized · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "Semaglutide | Research Use Only",
    whatItIsBody:        "Semaglutide is a synthetic analogue of human glucagon-like peptide-1 (GLP-1), a 31-amino acid incretin hormone. It shares approximately 94% sequence homology with native GLP-1 and is classified as a GLP-1 receptor agonist. It is used in research studying GLP-1 receptor activation, incretin signaling cascades, pancreatic function models, and single-receptor incretin pathway pharmacology.",
    compositionBody:     "Semaglutide has the molecular formula C187H291N45O59 with a molecular weight of approximately 4113.58 g/mol. It incorporates a C18 fatty diacid attached via a hydrophilic linker at position 26 lysine, which enables albumin binding and extended pharmacokinetic properties in experimental models. Synthesized via SPPS with fatty acid conjugation and supplied as a lyophilized powder.",
    researchApplications: [
      "GLP-1 receptor agonism and incretin signaling research",
      "Pancreatic beta-cell GLP-1 receptor signaling models",
      "Appetite and energy homeostasis pathway studies",
      "Cardiovascular risk factor modulation research models",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  DOC_CAPTION_PEPTIDE,
    propertiesTable: [
      { label: "CAS Number",        value: "910463-68-2" },
      { label: "Molecular Formula", value: "C187H291N45O59" },
      { label: "Molecular Weight",  value: "4113.58 g/mol" },
      { label: "Appearance",        value: "White to off-white lyophilized powder" },
      { label: "Sequence",          value: "31-amino acid GLP-1 analogue with C18 fatty diacid modification at Lys26" },
      { label: "Storage",           value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",        value: "24 months from manufacture date" },
      { label: "Vial Format",       value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",             value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 333,
    label: "Tirzepatide",
    subtitle:            "Dual GIP/GLP-1 receptor agonist · Lyophilized · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "Tirzepatide | Research Use Only",
    whatItIsBody:        "Tirzepatide (LY3298176) is a synthetic 39-amino acid dual agonist peptide that activates both GIP and GLP-1 receptors. In scientific literature it is classified as a dual glucose-dependent insulinotropic polypeptide and glucagon-like peptide-1 receptor agonist and is used in research studying dual incretin receptor co-activation, pancreatic beta-cell signaling, and multi-receptor metabolic pathway models.",
    compositionBody:     "Tirzepatide has the molecular formula C225H348N48O68 with a molecular weight of approximately 4813.48 g/mol. It is a fatty-acid modified peptide incorporating a C20 fatty diacid moiety via a linker that extends half-life in experimental models. Synthesized via SPPS with fatty acid conjugation and supplied as a lyophilized powder.",
    researchApplications: [
      "Dual GIP and GLP-1 receptor co-activation research",
      "Pancreatic beta-cell function and insulin secretion models",
      "Incretin-mediated glucose homeostasis pathway research",
      "Adipose tissue metabolism and lipid signaling studies",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  DOC_CAPTION_PEPTIDE,
    propertiesTable: [
      { label: "CAS Number",        value: "2023788-19-2" },
      { label: "Molecular Formula", value: "C225H348N48O68" },
      { label: "Molecular Weight",  value: "4813.48 g/mol" },
      { label: "Appearance",        value: "White to off-white lyophilized powder" },
      { label: "Sequence",          value: "39-amino acid dual GIP/GLP-1 agonist with C20 fatty diacid modification" },
      { label: "Storage",           value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",        value: "24 months from manufacture date" },
      { label: "Vial Format",       value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",             value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 337,
    label: "Retatrutide",
    subtitle:            "Triple incretin receptor agonist · Lyophilized · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "Retatrutide | Research Use Only",
    whatItIsBody:        "Retatrutide (LY3437943) is a synthetic 39-amino acid peptide engineered as a triple-receptor agonist targeting GIP, GLP-1, and glucagon receptors simultaneously. In scientific literature it is described as a triple incretin receptor agonist and is studied in research involving multi-receptor metabolic signaling and triple-incretin pathway models.",
    compositionBody:     "Retatrutide has the molecular formula C231H360N52O70 with a molecular weight of approximately 4875.42 g/mol. It is produced via SPPS with multi-step HPLC purification for high sequence fidelity. As a triple agonist it is structurally distinct from single-receptor GLP-1 agonists, incorporating activation domains for all three incretin-related receptor pathways.",
    researchApplications: [
      "Triple incretin receptor signaling pathway research",
      "Multi-receptor metabolic pharmacology models",
      "GIP, GLP-1, and glucagon receptor co-activation studies",
      "Hepatic lipid metabolism and steatosis research models",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  DOC_CAPTION_PEPTIDE,
    propertiesTable: [
      { label: "CAS Number",        value: "2381089-83-2" },
      { label: "Molecular Formula", value: "C231H360N52O70" },
      { label: "Molecular Weight",  value: "4875.42 g/mol" },
      { label: "Appearance",        value: "White to off-white lyophilized powder" },
      { label: "Sequence",          value: "39-amino acid peptide with GIP, GLP-1, and glucagon receptor activation domains" },
      { label: "Storage",           value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",        value: "24 months from manufacture date" },
      { label: "Vial Format",       value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",             value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 335,
    label: "KGLOW",
    subtitle:            "4-peptide blend · Lyophilized · 80mg per vial · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "KGLOW | Research Use Only",
    whatItIsBody:        "KGLOW is a multi-component peptide reagent combining four independently studied synthetic peptides into a single lyophilized vial. The blend comprises GHK-Cu, BPC-157, TB-500, and KPV at fixed mass ratios — 50mg GHK-Cu, 10mg BPC-157, 10mg TB-500, and 10mg KPV per 80mg vial. It is used in research studying how complementary signaling pathways interact simultaneously across extracellular matrix remodeling, actin-mediated cytoskeletal dynamics, cytoprotective signaling, and NF-kB inflammatory pathway modulation models.",
    compositionBody:     "GHK-Cu (50mg): Copper tripeptide studied in extracellular matrix remodeling, collagen synthesis signaling, and copper-dependent enzyme activity research models.\n\nBPC-157 (10mg): Synthetic pentadecapeptide studied in gastrointestinal mucosal signaling, connective tissue cell biology, and angiogenesis pathway research.\n\nTB-500 (10mg): Thymosin beta-4 synthetic fragment studied in actin dynamics, cell migration signaling, and endothelial cell biology research models.\n\nKPV (10mg): Lys-Pro-Val tripeptide studied for NF-kB pathway modulation via competitive importin-alpha3 binding and MAPK suppression in inflammatory signaling research.\n\nThe four components are verified individually within the blend COA.",
    researchApplications: [
      "Multi-pathway extracellular matrix remodeling and collagen synthesis research",
      "NF-kB inflammatory signaling pathway modulation studies",
      "Actin-mediated cytoskeletal dynamics and cell migration models",
      "Synergistic angiogenesis and vascular signaling pathway research",
      "Cytoprotective and tissue homeostasis multi-receptor interaction models",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  "COA issued by accredited independent third-party laboratory. All four peptide components are verified individually within the blend COA.",
    propertiesTable: [
      { label: "Blend Format",   value: "4-component lyophilized peptide blend" },
      { label: "Total Content",  value: "80mg per vial" },
      { label: "Composition",    value: "GHK-Cu 50mg / BPC-157 10mg / TB-500 10mg / KPV 10mg" },
      { label: "Appearance",     value: "Off-white to pale blue lyophilized powder (blue tint from GHK-Cu copper content — normal)" },
      { label: "Storage",        value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",     value: "24 months from manufacture date" },
      { label: "Reconstitution", value: "Bacteriostatic water recommended — sold separately" },
      { label: "Vial Format",    value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",          value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 336,
    label: "GHK-Cu",
    subtitle:            "Copper tripeptide-1 · Lyophilized · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "GHK-Cu | Research Use Only",
    whatItIsBody:        "GHK-Cu (Copper Peptide GHK) is a naturally occurring copper complex of the tripeptide glycyl-L-histidyl-L-lysine. First isolated from human plasma, it is found in several human tissues and studied extensively in research related to copper-dependent enzyme systems, dermal cell biology, and extracellular matrix signaling models.",
    compositionBody:     "GHK-Cu has the molecular formula C14H24N6O4 with a molecular weight of approximately 340.38 g/mol (free peptide). It is synthesized by complexing the GHK tripeptide with cupric acetate and supplied as a fine lyophilized powder. Physical appearance ranges from purple to blue depending on copper content and hydration state.",
    researchApplications: [
      "Dermal fibroblast and extracellular matrix signaling research",
      "Copper-dependent enzyme activity models",
      "Wound healing and tissue remodeling biology research",
      "Antioxidant and anti-inflammatory pathway studies",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  DOC_CAPTION_PEPTIDE,
    propertiesTable: [
      { label: "CAS Number",        value: "130120-56-8" },
      { label: "Molecular Formula", value: "C14H24N6O4 (Cu complex)" },
      { label: "Molecular Weight",  value: "340.38 g/mol" },
      { label: "Appearance",        value: "Fine purple to blue lyophilized powder" },
      { label: "Sequence",          value: "Gly-His-Lys" },
      { label: "Storage",           value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",        value: "24 months from manufacture date" },
      { label: "Vial Format",       value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",             value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 354,   // TB-500 created by migration script
    label: "TB-500",
    subtitle:            "Thymosin beta-4 synthetic fragment · Lyophilized · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "TB-500 | Research Use Only",
    whatItIsBody:        "TB-500 is a synthetic analogue of the naturally occurring peptide Thymosin Beta-4 (TB4), a 43-amino acid protein found in virtually all human and animal cells. The TB-500 fragment corresponds to a key active region of TB4 and is studied as a research tool in cell migration, actin dynamics, and tissue modeling research.",
    compositionBody:     "TB-500 is a 17-amino acid fragment with molecular formula C44H77N13O15S and a molecular weight of approximately 1099.24 g/mol. Synthesized via SPPS and supplied lyophilized. The fragment contains the actin-binding domain considered central to TB4 research models.",
    researchApplications: [
      "Actin dynamics and cytoskeletal organization research",
      "Cell migration signaling model studies",
      "Angiogenesis and endothelial cell research",
      "Inflammatory signaling pathway modulation research",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  DOC_CAPTION_PEPTIDE,
    propertiesTable: [
      { label: "CAS Number",        value: "77591-33-4" },
      { label: "Molecular Formula", value: "C44H77N13O15S" },
      { label: "Molecular Weight",  value: "1099.24 g/mol" },
      { label: "Appearance",        value: "White lyophilized powder" },
      { label: "Sequence",          value: "Ac-Lys-Thr-Thr-Thr-Lys-Gly-Asp-Ile-Glu-Lys-Phe-Leu-Lys-Glu-Leu-Arg-Met" },
      { label: "Storage",           value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",        value: "24 months from manufacture date" },
      { label: "Vial Format",       value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",             value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 346,   // MOTS-c created by migration script
    label: "MOTS-c",
    subtitle:            "Mitochondrial-derived peptide · Lyophilized · Research grade",
    trustBadges:         PEPTIDE_TRUST_BADGES,
    whatItIsSubtitle:    "MOTS-c | Research Use Only",
    whatItIsBody:        "MOTS-c (Mitochondrial Open Reading Frame of the 12S rRNA-c) is a 16-amino acid peptide encoded within the mitochondrial genome. It is classified as a mitochondrial-derived peptide (MDP) and is studied as a research tool in mitochondrial-nuclear communication, glucose metabolism signaling, and cellular stress response models.",
    compositionBody:     "MOTS-c has the molecular formula C110H196N44O31S2 with a molecular weight of approximately 2174.12 g/mol. It is synthesized via SPPS and supplied as a white lyophilized powder. As a mitochondrially-encoded peptide it represents a distinct class of signaling molecules compared to nuclear-genome-derived peptides.",
    researchApplications: [
      "Mitochondrial-nuclear retrograde signaling research",
      "Glucose metabolism and insulin signaling pathway studies",
      "Cellular stress response and AMPK pathway modulation research",
      "Aging biology and metabolic homeostasis models",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics:  PEPTIDE_METRICS,
    documentationCaption:  DOC_CAPTION_PEPTIDE,
    propertiesTable: [
      { label: "CAS Number",        value: "1627580-64-6" },
      { label: "Molecular Formula", value: "C110H196N44O31S2" },
      { label: "Molecular Weight",  value: "2174.12 g/mol" },
      { label: "Appearance",        value: "White lyophilized powder" },
      { label: "Sequence",          value: "Met-Arg-Trp-Gln-Glu-Met-Gly-Tyr-Ile-Phe-Tyr-Pro-Arg-Lys-Leu-Arg" },
      { label: "Storage",           value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life",        value: "24 months from manufacture date" },
      { label: "Vial Format",       value: "Lyophilized · Sealed glass vial" },
      { label: "Terms",             value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    shippingType: "standard",
  },
  {
    wcId: 349,   // Bacteriostatic Water created by migration script
    label: "Bacteriostatic Water",
    subtitle:            "0.9% benzyl alcohol · Sterile · 30mL multi-use vial",
    trustBadges:         ["Sterility certified", "0.9% benzyl alcohol", "Multi-use sealed vial", "Same-day shipping"],
    whatItIsSubtitle:    "Bacteriostatic Water | Research Use Only",
    whatItIsBody:        "Bacteriostatic water (BW) is sterile water for injection containing 0.9% benzyl alcohol as a preservative. The benzyl alcohol component inhibits microbial growth, allowing the vial to be used multiple times without contamination over a defined period. It is the standard reconstitution solvent used in peptide research laboratories for lyophilized peptide preparation prior to in vitro use.",
    compositionBody:     "Bacteriostatic water is an aqueous solution containing water for injection (WFI) meeting sterility requirements and benzyl alcohol (C7H8O) at 0.9% w/v concentration. Supplied in sealed 30mL multi-use glass vials. No active peptide or pharmaceutical ingredient — used as a diluent and reconstitution solvent only.",
    researchApplications: [
      "Standard reconstitution solvent for lyophilized peptide research",
      "Multi-use vial format for repeated aliquoting in laboratory settings",
      "Benzyl alcohol preservation system for in vitro solution stability",
      "Compatible with all Anvil Compounds lyophilized research peptides",
    ],
    documentationHeading:  DOC_HEADING,
    documentationMetrics: [
      { label: "Sterility",       value: "Certified" },
      { label: "Lot ID",          value: "Pending — first batch" },
      { label: "Analysis Date",   value: "Pending — first batch" },
      { label: "Benzyl Alcohol",  value: "0.9% w/v" },
    ],
    documentationCaption:  "Certificate of Analysis issued upon batch completion. Sterility tested per USP standards.",
    propertiesTable: [
      { label: "Composition",        value: "Water for injection + 0.9% benzyl alcohol" },
      { label: "CAS (benzyl alcohol)", value: "100-51-6" },
      { label: "Appearance",         value: "Clear colorless sterile solution" },
      { label: "Volume",             value: "30mL per vial" },
      { label: "Vial Format",        value: "Sealed multi-use glass vial with rubber stopper" },
      { label: "Storage",            value: "Room temperature · Protected from light" },
      { label: "Terms",              value: "For laboratory diluent use only. Not for human or animal injection." },
    ],
    shippingType: "ambient",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=".repeat(70));
  console.log("Anvil Compounds — ACF Field Population");
  console.log(`Target: ${WC_URL}`);
  console.log("=".repeat(70));

  // Verify write access
  try {
    await wcJson(`/products/332`);
  } catch (err) {
    if (err.status === 401) {
      console.error("\nERROR: API key does not have read access. Check credentials.");
      process.exit(1);
    }
  }

  const report = [];

  for (const product of PRODUCTS) {
    try {
      const result = await populateProduct(product.wcId, product, product.label);
      report.push({ ...result, status: "ok" });
    } catch (err) {
      console.error(`\n[${product.label}] ERROR:`, err.message);
      report.push({ label: product.label, wcId: product.wcId, fields: 0, status: `ERROR: ${err.message}` });
    }
  }

  // Report
  console.log("\n" + "=".repeat(70));
  console.log("POPULATION REPORT");
  console.log("=".repeat(70));
  console.log(`${"Product".padEnd(22)} ${"WC ID".padEnd(8)} ${"Fields".padEnd(8)} Status`);
  console.log("-".repeat(70));
  for (const r of report) {
    console.log(
      `${r.label.padEnd(22)} ${String(r.wcId).padEnd(8)} ${String(r.fields).padEnd(8)} ${r.status}`
    );
  }
  console.log("=".repeat(70));

  const errors = report.filter((r) => r.status !== "ok").length;
  console.log(`Done. ${errors} error(s).`);

  // Content mapping notes
  console.log("\nCONTENT MAPPING NOTES:");
  console.log("- subtitle       ← productData.descriptor");
  console.log("- what_it_is_body ← productData.whatItIs");
  console.log("- composition_body ← productData.molecularProfile (peptides) / blend composition (KGLOW)");
  console.log("- research_applications ← productData.researchFocusAreas");
  console.log("- properties_table ← productData.properties");
  console.log("- documentation_metrics ← placeholder values (COAs not yet available)");
  console.log("- documentation_file ← NOT populated (no PDFs yet)");
  console.log("- related_products_override ← NOT populated (auto-categorization)");
  console.log("- Citations from productData.ts ← NOT mapped (no ACF field defined for citations)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
