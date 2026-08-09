#!/usr/bin/env node
/**
 * Anvil Compounds — Research Bundles creation script
 *
 * Creates the 5 new "Research Bundles" WooCommerce products (variable type,
 * one variation each spelling out the mix, matching the existing Wolverine
 * BPC-157+TB-500 bundle pattern) and writes their full ACF content in one
 * pass. Idempotent — safe to re-run (updates by slug instead of duplicating).
 *
 * Run: node --env-file=.env.local scripts/create-bundle-products.js
 *
 * All purity/identity/endotoxin/lot values below are the REAL, currently-
 * live per-compound values pulled from each standalone product's own WC
 * meta_data on 2026-08-09 — not placeholders. COA files are merged PDFs of
 * the real individual COAs (see public/documents/*-bundle-coa.pdf), same
 * pattern as the existing Wolverine bundle's documentation_file.
 */

const WC_URL = process.env.WC_URL;
const KEY = process.env.WC_CONSUMER_KEY;
const SECRET = process.env.WC_CONSUMER_SECRET;

if (!WC_URL || !KEY || !SECRET) {
  console.error("Missing env vars. Run with: node --env-file=.env.local scripts/create-bundle-products.js");
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");
const SITE_URL = "https://www.anvilcompounds.shop";

async function wc(path, options = {}, retries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${WC_URL}/wp-json/wc/v3${path}`, {
        ...options,
        headers: { Authorization: AUTH, "Content-Type": "application/json", ...options.headers },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${data.message || JSON.stringify(data)}`);
      return data;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.warn(`  retrying after error: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeHtml(str) {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

async function ensureCategory(name) {
  const cats = await wc(`/products/categories?per_page=100`);
  const existing = cats.find((c) => decodeHtml(c.name).toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  try {
    return await wc("/products/categories", { method: "POST", body: JSON.stringify({ name }) });
  } catch (err) {
    if (err.message.includes("term_id")) {
      const match = err.message.match(/"term_id":(\d+)/);
      if (match) return { id: Number(match[1]), name };
    }
    throw err;
  }
}

async function findBySlug(slug) {
  const results = await wc(`/products?slug=${encodeURIComponent(slug)}`);
  return results[0] ?? null;
}

// ---------------------------------------------------------------------------
// ACF meta builder — same repeater-flattening pattern as
// scripts/populate-acf-fields.js
// ---------------------------------------------------------------------------
function buildAcfMeta(b) {
  const meta = [];
  const add = (key, value, fieldKey) => {
    meta.push({ key, value });
    if (fieldKey) meta.push({ key: `_${key}`, value: fieldKey });
  };

  add("subtitle", b.subtitle, "field_anvil_subtitle");
  add("what_it_is_subtitle", b.whatItIsSubtitle, "field_anvil_what_it_is_subtitle");
  add("what_it_is_body", b.whatItIsBody, "field_anvil_what_it_is_body");
  add("composition_body", b.compositionBody, "field_anvil_composition_body");
  add("documentation_section_heading", DOC_HEADING, "field_anvil_documentation_heading");
  add("documentation_caption", DOC_CAPTION_BUNDLE, "field_anvil_documentation_caption");
  add("shipping_type", "standard", "field_anvil_shipping_type");
  add("documentation_file", b.documentationFile, null);

  add("trust_badges", String(TRUST_BADGES.length), "field_anvil_trust_badges");
  TRUST_BADGES.forEach((t, i) => add(`trust_badges_${i}_badge`, t, "field_anvil_trust_badge_text"));

  add("research_applications", String(b.researchApplications.length), "field_anvil_research_applications");
  b.researchApplications.forEach((a, i) => add(`research_applications_${i}_application`, a, "field_anvil_research_application_text"));

  add("documentation_metrics", String(b.documentationMetrics.length), "field_anvil_documentation_metrics");
  b.documentationMetrics.forEach(({ label, value }, i) => {
    add(`documentation_metrics_${i}_label`, label, "field_anvil_doc_metric_label");
    add(`documentation_metrics_${i}_value`, value, "field_anvil_doc_metric_value");
  });

  add("properties_table", String(b.propertiesTable.length), "field_anvil_properties_table");
  b.propertiesTable.forEach(({ label, value }, i) => {
    add(`properties_table_${i}_label`, label, "field_anvil_prop_label");
    add(`properties_table_${i}_value`, value, "field_anvil_prop_value");
  });

  return meta;
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------
const TRUST_BADGES = ["99%+ purity", "Endotoxin screened", "COA verified", "Same-day shipping"];
const DOC_HEADING = "Documentation & Quality";
// "bundle" (not "blend") — these are separate individually-vialed products
// co-shipped in one order, not a single co-formulated vial like KLOW/GLOW.
const DOC_CAPTION_BUNDLE =
  "COA issued by accredited independent third-party laboratory. All component peptides are verified individually within the bundle COA. Verification link confirms results were not self-reported by Anvil Compounds.";

// ---------------------------------------------------------------------------
// Bundle data
// ---------------------------------------------------------------------------
const BUNDLES = [
  {
    name: "Energy Research Bundle",
    slug: "energy-research-bundle",
    price: 105,
    variationLabel: "10mg MOTS-C + 500mg NAD+",
    subtitle: "MOTS-C + NAD+ · Research bundle · Research grade",
    whatItIsSubtitle: "Energy Research Bundle | Research Use Only",
    whatItIsBody:
      "The Energy Research Bundle pairs MOTS-C, a mitochondrial-derived peptide studied for its role in metabolic stress response, with NAD+, a coenzyme central to cellular energy metabolism and DNA repair. Bundled together for research into cellular energy production and mitochondrial signaling pathways.",
    compositionBody:
      "MOTS-C (10mg): A 16-amino acid mitochondrial-derived peptide encoded within the mitochondrial genome, studied for its role in metabolic homeostasis and cellular stress response.\n\nNAD+ (500mg): Nicotinamide adenine dinucleotide, a coenzyme present in all living cells, central to redox reactions, DNA repair, and mitochondrial function.\n\nBoth components are verified individually within the bundle COA.",
    researchApplications: [
      "Mitochondrial-nuclear communication research",
      "Cellular energy metabolism and redox reaction studies",
      "DNA repair pathway research",
      "Metabolic stress response models",
    ],
    documentationMetrics: [
      { label: "Purity", value: "MOTS-C 99.49% · NAD+ 99.67%" },
      { label: "Identity", value: "Confirmed (MOTS-C + NAD+, tested individually)" },
      { label: "Endotoxin", value: "Pass (LAL, both components)" },
      { label: "Lot ID", value: "See individual COAs" },
    ],
    propertiesTable: [
      { label: "Bundle Format", value: "2-product research bundle, individually vialed" },
      { label: "Composition", value: "MOTS-C 10mg + NAD+ 500mg" },
      { label: "MOTS-C Lot", value: "AC-MOT-1" },
      { label: "NAD+ Lot", value: "AC-NAD-1" },
      { label: "Appearance", value: "MOTS-C: white lyophilized powder · NAD+: solution" },
      { label: "Storage", value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life", value: "24 months from manufacture date" },
      { label: "Terms", value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    documentationFile: `${SITE_URL}/documents/energy-bundle-coa.pdf`,
  },
  {
    name: "GHRH Bundle",
    slug: "ghrh-bundle",
    price: 130,
    variationLabel: "10mg Retatrutide + CJC-1295/Ipamorelin 5+5mg",
    subtitle: "Retatrutide + CJC-1295/Ipamorelin · Research bundle · Research grade",
    whatItIsSubtitle: "GHRH Bundle | Research Use Only",
    whatItIsBody:
      "The GHRH Bundle pairs Retatrutide, a triple GIP/GLP-1/glucagon receptor agonist, with CJC-1295 and Ipamorelin, a growth-hormone secretagogue combination. Bundled for research spanning metabolic receptor signaling and growth-hormone axis pathways.",
    compositionBody:
      "Retatrutide (10mg): A 39-amino acid triple-receptor agonist targeting GIP, GLP-1, and glucagon receptors.\n\nCJC-1295 + Ipamorelin (5mg + 5mg): A combined growth-hormone-releasing hormone (GHRH) analogue and ghrelin-receptor agonist, studied for synergistic effects on GH pulsatility.\n\nBoth components are verified individually within the bundle COA.",
    researchApplications: [
      "Multi-receptor metabolic pharmacology research",
      "Growth-hormone axis regulation studies",
      "GH pulsatility and secretagogue signaling models",
      "Incretin / growth-hormone pathway crossover research",
    ],
    documentationMetrics: [
      { label: "Purity", value: "Retatrutide 99.95% · CJC-1295/Ipamorelin 99.91%" },
      { label: "Identity", value: "Confirmed (Retatrutide + CJC-1295/Ipamorelin, tested individually)" },
      { label: "Endotoxin", value: "Pass (LAL, both components)" },
      { label: "Lot ID", value: "See individual COAs" },
    ],
    propertiesTable: [
      { label: "Bundle Format", value: "2-product research bundle, individually vialed" },
      { label: "Composition", value: "Retatrutide 10mg + CJC-1295/Ipamorelin 5+5mg" },
      { label: "Retatrutide Lot", value: "AC-RT-1" },
      { label: "CJC-1295/Ipamorelin Lot", value: "AC-CJIP-1" },
      { label: "Appearance", value: "White lyophilized powder" },
      { label: "Storage", value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life", value: "24 months from manufacture date" },
      { label: "Terms", value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    documentationFile: `${SITE_URL}/documents/ghrh-bundle-coa.pdf`,
  },
  {
    name: "Metabolic Research Bundle",
    slug: "metabolic-research-bundle",
    price: 125,
    variationLabel: "10mg MOTS-C + 10mg Retatrutide",
    subtitle: "MOTS-C + Retatrutide · Research bundle · Research grade",
    whatItIsSubtitle: "Metabolic Research Bundle | Research Use Only",
    whatItIsBody:
      "The Metabolic Research Bundle pairs MOTS-C, a mitochondrial-derived peptide studied in metabolic stress response, with Retatrutide, a triple incretin receptor agonist. Bundled for research spanning mitochondrial signaling and multi-receptor metabolic pathways.",
    compositionBody:
      "MOTS-C (10mg): A 16-amino acid mitochondrial-derived peptide studied for its role in metabolic homeostasis and cellular stress response.\n\nRetatrutide (10mg): A 39-amino acid triple-receptor agonist targeting GIP, GLP-1, and glucagon receptors.\n\nBoth components are verified individually within the bundle COA.",
    researchApplications: [
      "Multi-receptor metabolic signaling research",
      "Mitochondrial stress-response studies",
      "Glucose and lipid metabolism pathway research",
      "Combined incretin / mitochondrial signaling models",
    ],
    documentationMetrics: [
      { label: "Purity", value: "MOTS-C 99.49% · Retatrutide 99.95%" },
      { label: "Identity", value: "Confirmed (MOTS-C + Retatrutide, tested individually)" },
      { label: "Endotoxin", value: "Pass (LAL, both components)" },
      { label: "Lot ID", value: "See individual COAs" },
    ],
    propertiesTable: [
      { label: "Bundle Format", value: "2-product research bundle, individually vialed" },
      { label: "Composition", value: "MOTS-C 10mg + Retatrutide 10mg" },
      { label: "MOTS-C Lot", value: "AC-MOT-1" },
      { label: "Retatrutide Lot", value: "AC-RT-1" },
      { label: "Appearance", value: "White lyophilized powder" },
      { label: "Storage", value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life", value: "24 months from manufacture date" },
      { label: "Terms", value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    documentationFile: `${SITE_URL}/documents/metabolic-bundle-coa.pdf`,
  },
  {
    name: "Full Research Bundle",
    slug: "full-research-bundle",
    price: 240,
    variationLabel: "Retatrutide 10mg + NAD+ 500mg + CJC-1295/Ipamorelin 5+5mg + GHK-Cu 100mg",
    subtitle: "Retatrutide + NAD+ + CJC-1295/Ipamorelin + GHK-Cu · Research bundle · Research grade",
    whatItIsSubtitle: "Full Research Bundle | Research Use Only",
    whatItIsBody:
      "The Full Research Bundle combines four of Anvil's most-studied compounds — Retatrutide, NAD+, CJC-1295 + Ipamorelin, and GHK-Cu — spanning metabolic, mitochondrial, growth-hormone, and tissue-remodeling research in a single order.",
    compositionBody:
      "Retatrutide (10mg): Triple GIP/GLP-1/glucagon receptor agonist.\n\nNAD+ (500mg): Coenzyme central to redox reactions, DNA repair, and mitochondrial function.\n\nCJC-1295 + Ipamorelin (5mg + 5mg): Combined GHRH analogue and ghrelin-receptor agonist.\n\nGHK-Cu (100mg): Naturally occurring copper-binding tripeptide studied for cellular signaling and tissue-remodeling research.\n\nAll four components are verified individually within the bundle COA.",
    researchApplications: [
      "Multi-receptor metabolic pharmacology research",
      "Cellular energy metabolism and DNA repair studies",
      "Growth-hormone axis and GH pulsatility research",
      "Collagen and extracellular-matrix remodeling research",
    ],
    documentationMetrics: [
      { label: "Purity", value: "Retatrutide 99.95% · NAD+ 99.67% · CJC-1295/Ipamorelin 99.91% · GHK-Cu 99.73%" },
      { label: "Identity", value: "Confirmed (all 4 components, tested individually)" },
      { label: "Endotoxin", value: "Pass (LAL, all components)" },
      { label: "Lot ID", value: "See individual COAs" },
    ],
    propertiesTable: [
      { label: "Bundle Format", value: "4-product research bundle, individually vialed" },
      { label: "Composition", value: "Retatrutide 10mg + NAD+ 500mg + CJC-1295/Ipamorelin 5+5mg + GHK-Cu 100mg" },
      { label: "Retatrutide Lot", value: "AC-RT-1" },
      { label: "NAD+ Lot", value: "AC-NAD-1" },
      { label: "CJC-1295/Ipamorelin Lot", value: "AC-CJIP-1" },
      { label: "GHK-Cu Lot", value: "AC-GHK-1" },
      { label: "Storage", value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life", value: "24 months from manufacture date" },
      { label: "Terms", value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    documentationFile: `${SITE_URL}/documents/full-bundle-coa.pdf`,
  },
  {
    name: "Cognitive Research Bundle",
    slug: "cognitive-research-bundle",
    price: 90,
    variationLabel: "Semax 10mg + Selank 10mg",
    subtitle: "Semax + Selank · Research bundle · Research grade",
    whatItIsSubtitle: "Cognitive Research Bundle | Research Use Only",
    whatItIsBody:
      "The Cognitive Research Bundle pairs Semax, a synthetic ACTH(4-10) analogue studied for neurotrophic factor expression, with Selank, a synthetic tuftsin analogue studied for GABAergic pathway modulation. Bundled for combined neuropeptide signaling research.",
    compositionBody:
      "Semax (10mg): A synthetic heptapeptide analogue of ACTH(4-10), studied in research involving neurotrophic factor expression, BDNF signaling, and neuroprotective pathway models.\n\nSelank (10mg): A synthetic heptapeptide analogue of tuftsin, studied in research involving GABAergic pathway modulation and neuropeptide signaling.\n\nBoth components are verified individually within the bundle COA.",
    researchApplications: [
      "Neurotrophic factor expression and BDNF signaling research",
      "GABAergic pathway modulation studies",
      "Neuropeptide signaling research",
      "Combined cognitive-pathway research models",
    ],
    documentationMetrics: [
      { label: "Purity", value: "Semax 99.52% · Selank 99.52%" },
      { label: "Identity", value: "Confirmed (Semax + Selank, tested individually)" },
      { label: "Endotoxin", value: "Pass (LAL, both components)" },
      { label: "Lot ID", value: "See individual COAs" },
    ],
    propertiesTable: [
      { label: "Bundle Format", value: "2-product research bundle, individually vialed" },
      { label: "Composition", value: "Semax 10mg + Selank 10mg" },
      { label: "Semax Lot", value: "AC-SMX-1" },
      { label: "Selank Lot", value: "AC-SLK-1" },
      { label: "Appearance", value: "White lyophilized powder" },
      { label: "Storage", value: "-20°C · Sealed · Protected from light" },
      { label: "Shelf Life", value: "24 months from manufacture date" },
      { label: "Terms", value: "RUO only. Not for human, animal, diagnostic, or household use." },
    ],
    documentationFile: `${SITE_URL}/documents/cognitive-bundle-coa.pdf`,
  },
];

async function main() {
  console.log("Resolving 'Research Bundles' category...");
  const category = await ensureCategory("Research Bundles");
  console.log("Category id:", category.id);

  const results = [];

  for (const b of BUNDLES) {
    console.log(`\n=== ${b.name} ===`);
    let product = await findBySlug(b.slug);

    const basePayload = {
      name: b.name,
      slug: b.slug,
      type: "variable",
      status: "publish",
      categories: [{ id: category.id }],
      short_description: b.subtitle,
      description: b.whatItIsBody,
      attributes: [
        { name: "Size", visible: true, variation: true, options: [b.variationLabel] },
      ],
    };

    if (product) {
      console.log(`  Found existing product id ${product.id} — updating`);
      product = await wc(`/products/${product.id}`, { method: "PUT", body: JSON.stringify(basePayload) });
    } else {
      console.log("  Creating new product");
      product = await wc(`/products`, { method: "POST", body: JSON.stringify(basePayload) });
    }
    await sleep(400);

    const existingVars = await wc(`/products/${product.id}/variations?per_page=20`);
    const existingVar = existingVars.find((v) => v.attributes.some((a) => a.option === b.variationLabel));
    const varPayload = { regular_price: String(b.price), attributes: [{ name: "Size", option: b.variationLabel }], status: "publish" };
    if (existingVar) {
      await wc(`/products/${product.id}/variations/${existingVar.id}`, { method: "PUT", body: JSON.stringify(varPayload) });
      console.log(`  Updated variation: ${b.variationLabel} — $${b.price}`);
    } else {
      await wc(`/products/${product.id}/variations`, { method: "POST", body: JSON.stringify(varPayload) });
      console.log(`  Created variation: ${b.variationLabel} — $${b.price}`);
    }
    await sleep(400);

    console.log("  Writing ACF content...");
    const current = await wc(`/products/${product.id}`);
    const existingIdMap = {};
    for (const m of current.meta_data || []) existingIdMap[m.key] = m.id;
    const newMeta = buildAcfMeta(b);
    const metaWithIds = newMeta.map((m) =>
      existingIdMap[m.key] !== undefined ? { id: existingIdMap[m.key], key: m.key, value: m.value } : m
    );
    await wc(`/products/${product.id}`, { method: "PUT", body: JSON.stringify({ meta_data: metaWithIds }) });
    await sleep(400);

    console.log(`  ✓ Done — id ${product.id}`);
    results.push({ name: b.name, slug: b.slug, id: product.id, price: b.price });
  }

  console.log("\n\n=== SUMMARY (add these IDs to lib/woocommerce.ts SLUG_TO_WC_ID) ===");
  results.forEach((r) => console.log(`  "${r.slug}": ${r.id},  // ${r.name} — $${r.price}`));
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
