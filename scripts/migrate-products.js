#!/usr/bin/env node
/**
 * Anvil Compounds — WooCommerce Product Migration Script
 *
 * Syncs all product data to WooCommerce (creates or updates as needed).
 * Run with: node scripts/migrate-products.js
 *
 * Reads WC credentials from .env.local — no extra dependencies needed.
 * Requires Node 18+ (native fetch).
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("ERROR: .env.local not found at", envPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const WC_URL = (process.env.WC_URL || process.env.NEXT_PUBLIC_WC_URL || "").replace(/\/$/, "");
const KEY = process.env.WC_CONSUMER_KEY;
const SECRET = process.env.WC_CONSUMER_SECRET;

if (!WC_URL || !KEY || !SECRET) {
  console.error(
    "ERROR: Missing WC_URL / WC_CONSUMER_KEY / WC_CONSUMER_SECRET in .env.local"
  );
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(KEY + ":" + SECRET).toString("base64");

// ---------------------------------------------------------------------------
// Product data
// ---------------------------------------------------------------------------
const PRODUCTS = [
  {
    name: "BPC-157",
    wcId: 332,
    category: "Repair & Recovery Research",
    shortDesc: "Pentadecapeptide fragment · Lyophilized · Research grade",
    price: 44,
    sizes: [
      { name: "10mg", price: 44 },
    ],
    longDesc:
      "BPC-157, also written as Body Protection Compound-157, is a synthetic pentadecapeptide derived from a partial sequence of a protective protein found in gastric juice. In scientific literature it is classified as a stable gastric pentadecapeptide and is studied as a tool compound in receptor and signaling research across gastrointestinal, connective tissue, and angiogenesis models.\n\nMolecular profile: BPC-157 is a 15-amino acid peptide with the molecular formula C62H98N16O22 and a molecular weight of approximately 1419.56 g/mol. It is synthesized via standard solid-phase peptide synthesis (SPPS) and supplied in lyophilized form for stability.\n\nResearch focus areas: Gastrointestinal mucosal signaling research · Connective tissue and tendon cell biology models · Angiogenesis and vascular signaling pathway studies · Nitric oxide system modulation research\n\nProperties: CAS 137525-51-0 · MW 1419.56 g/mol · Sequence: Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val · Storage: -20°C sealed · Shelf life: 24 months\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "T1rz",
    wcId: 333,
    slug: "t1rz",
    category: "Metabolic Research",
    shortDesc: "Dual GIP/GLP-1 receptor agonist · Lyophilized · Research grade",
    price: 54,
    sizes: [
      { name: "10mg", price: 54 },
      { name: "20mg", price: 109 },
    ],
    longDesc:
      "Tirzepatide (LY3298176) is a synthetic 39-amino acid dual agonist peptide that activates both GIP and GLP-1 receptors. In scientific literature it is classified as a dual glucose-dependent insulinotropic polypeptide and glucagon-like peptide-1 receptor agonist and is used in research studying dual incretin receptor co-activation, pancreatic beta-cell signaling, and multi-receptor metabolic pathway models.\n\nMolecular profile: Molecular formula C225H348N48O68, molecular weight approximately 4813.48 g/mol. Fatty-acid modified peptide incorporating a C20 fatty diacid moiety via linker. Synthesized via SPPS with fatty acid conjugation.\n\nResearch focus areas: Dual GIP and GLP-1 receptor co-activation research · Pancreatic beta-cell function and insulin secretion models · Incretin-mediated glucose homeostasis pathway research · Adipose tissue metabolism and lipid signaling studies\n\nProperties: CAS 2023788-19-2 · MW 4813.48 g/mol · Sequence: 39-amino acid dual GIP/GLP-1 agonist with C20 fatty diacid modification · Storage: -20°C sealed · Shelf life: 24 months\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "R3ta",
    wcId: 337,
    slug: "r3ta",
    category: "Metabolic Research",
    shortDesc: "Triple incretin receptor agonist · Lyophilized · Research grade",
    price: 64,
    sizes: [
      { name: "10mg", price: 64 },
      { name: "20mg", price: 94 },
    ],
    longDesc:
      "Retatrutide (LY3437943) is a synthetic 39-amino acid peptide engineered as a triple-receptor agonist targeting GIP, GLP-1, and glucagon receptors simultaneously. In scientific literature it is described as a triple incretin receptor agonist and is studied in research involving multi-receptor metabolic signaling and triple-incretin pathway models.\n\nMolecular profile: Molecular formula C231H360N52O70, molecular weight approximately 4875.42 g/mol. Produced via SPPS with multi-step HPLC purification. Structurally distinct from single-receptor GLP-1 agonists.\n\nResearch focus areas: Triple incretin receptor signaling pathway research · Multi-receptor metabolic pharmacology models · GIP, GLP-1, and glucagon receptor co-activation studies · Hepatic lipid metabolism and steatosis research models\n\nProperties: CAS 2381089-83-2 · MW 4875.42 g/mol · Sequence: 39-amino acid peptide with GIP, GLP-1, and glucagon receptor activation domains · Storage: -20°C sealed · Shelf life: 24 months\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "KLOW",
    wcId: 335,
    slug: "klow",
    category: "Longevity & Cosmetic Research",
    shortDesc: "4-peptide blend · Lyophilized · 80mg per vial · Research grade",
    price: 89,
    sizes: [], // simple product
    longDesc:
      "KLOW is a multi-component peptide reagent combining four independently studied synthetic peptides into a single lyophilized vial. The blend comprises GHK-Cu (50mg), BPC-157 (10mg), TB-500 (10mg), and KPV (10mg) per 80mg vial. It is used in research studying how complementary signaling pathways interact simultaneously across extracellular matrix remodeling, actin-mediated cytoskeletal dynamics, cytoprotective signaling, and NF-kB inflammatory pathway modulation models.\n\nBlend composition: GHK-Cu 50mg — copper tripeptide studied in extracellular matrix remodeling and collagen synthesis signaling. BPC-157 10mg — synthetic pentadecapeptide studied in gastrointestinal mucosal signaling and connective tissue biology. TB-500 10mg — thymosin beta-4 fragment studied in actin dynamics and cell migration. KPV 10mg — Lys-Pro-Val tripeptide studied for NF-kB pathway modulation.\n\nResearch focus areas: Multi-pathway extracellular matrix remodeling research · NF-kB inflammatory signaling pathway modulation · Actin-mediated cytoskeletal dynamics and cell migration models · Synergistic angiogenesis and vascular signaling research\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "GHK-Cu",
    wcId: 336,
    category: "Longevity & Cosmetic Research",
    shortDesc: "Copper tripeptide-1 · Lyophilized · Research grade",
    price: 34,
    sizes: [
      { name: "50mg", price: 34 },
      { name: "100mg", price: 44 },
    ],
    longDesc:
      "GHK-Cu (Copper Peptide GHK) is a naturally occurring copper complex of the tripeptide glycyl-L-histidyl-L-lysine. First isolated from human plasma, it is found in several human tissues and studied extensively in research related to copper-dependent enzyme systems, dermal cell biology, and extracellular matrix signaling models.\n\nMolecular profile: Molecular formula C14H24N6O4, molecular weight approximately 340.38 g/mol (free peptide). Synthesized by complexing the GHK tripeptide with cupric acetate. Physical appearance ranges from purple to blue depending on copper content and hydration state.\n\nResearch focus areas: Dermal fibroblast and extracellular matrix signaling research · Copper-dependent enzyme activity models · Wound healing and tissue remodeling biology research · Antioxidant and anti-inflammatory pathway studies\n\nProperties: CAS 130120-56-8 · MW 340.38 g/mol · Sequence: Gly-His-Lys · Storage: -20°C sealed · Shelf life: 24 months\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "TB-500",
    wcId: 354,
    category: "Repair & Recovery Research",
    shortDesc: "Thymosin beta-4 synthetic fragment · Lyophilized · Research grade",
    price: 64,
    sizes: [
      { name: "10mg", price: 64 },
    ],
    longDesc:
      "TB-500 is a synthetic analogue of the naturally occurring peptide Thymosin Beta-4 (TB4), a 43-amino acid protein found in virtually all human and animal cells. The TB-500 fragment corresponds to a key active region of TB4 and is studied as a research tool in cell migration, actin dynamics, and tissue modeling research.\n\nMolecular profile: 17-amino acid fragment with molecular formula C44H77N13O15S and molecular weight approximately 1099.24 g/mol. Synthesized via SPPS and supplied lyophilized. Contains the actin-binding domain considered central to TB4 research models.\n\nResearch focus areas: Actin dynamics and cytoskeletal organization research · Cell migration signaling model studies · Angiogenesis and endothelial cell research · Inflammatory signaling pathway modulation research\n\nProperties: CAS 77591-33-4 · MW 1099.24 g/mol · Sequence: Ac-Lys-Thr-Thr-Thr-Lys-Gly-Asp-Ile-Glu-Lys-Phe-Leu-Lys-Glu-Leu-Arg-Met · Storage: -20°C sealed · Shelf life: 24 months\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "MOTS-c",
    wcId: 346,
    category: "Metabolic Research",
    shortDesc: "Mitochondrial-derived peptide · Lyophilized · Research grade",
    price: 44,
    sizes: [
      { name: "10mg", price: 44 },
    ],
    longDesc:
      "MOTS-c (Mitochondrial Open Reading Frame of the 12S rRNA-c) is a 16-amino acid peptide encoded within the mitochondrial genome. It is classified as a mitochondrial-derived peptide (MDP) and is studied as a research tool in mitochondrial-nuclear communication, glucose metabolism signaling, and cellular stress response models.\n\nMolecular profile: Molecular formula C110H196N44O31S2, molecular weight approximately 2174.12 g/mol. Synthesized via SPPS and supplied as white lyophilized powder. As a mitochondrially-encoded peptide it represents a distinct class of signaling molecules.\n\nResearch focus areas: Mitochondrial-nuclear retrograde signaling research · Glucose metabolism and insulin signaling pathway studies · Cellular stress response and AMPK pathway modulation research · Aging biology and metabolic homeostasis models\n\nProperties: CAS 1627580-64-6 · MW 2174.12 g/mol · Sequence: Met-Arg-Trp-Gln-Glu-Met-Gly-Tyr-Ile-Phe-Tyr-Pro-Arg-Lys-Leu-Arg · Storage: -20°C sealed · Shelf life: 24 months\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  // ─── NEW SKUs — DRAFT until COA + images are live ──────────────────────────
  {
    name: "NAD+",
    wcId: 443,
    status: "draft",
    category: "Metabolic Research",
    shortDesc: "β-Nicotinamide adenine dinucleotide · Lyophilized · Research grade",
    price: 49,
    salePrice: 42,
    sizes: [], // simple product (500mg fixed)
    longDesc:
      "β-Nicotinamide adenine dinucleotide (NAD+) is a coenzyme found in all living cells and central to redox reactions and cellular energy metabolism. In research settings it is used as a substrate and cofactor for studying mitochondrial function, the NAD+ salvage pathway, and sirtuin- and PARP-dependent processes.\n\nMolecular profile: NAD+ has the molecular formula C21H27N7O14P2 and a molecular weight of 663.43 g/mol. It is synthesized enzymatically or via chemical synthesis and supplied as a white to off-white lyophilized powder. The two-electron redox cycle between NAD+ and NADH underlies its central role in cellular energy metabolism research.\n\nResearch focus areas: Cellular energy metabolism and redox balance research · Mitochondrial function models · Sirtuin and DNA-repair pathway studies · NAD+ salvage pathway research\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "Tesamorelin",
    wcId: 445,
    status: "draft",
    category: "Growth Pathway Research",
    shortDesc: "44-amino-acid GHRH analog (hexenoyl-modified) · Lyophilized · Research grade",
    price: 80,
    salePrice: 59,
    sizes: [], // simple product (10mg fixed)
    longDesc:
      "Tesamorelin is a synthetic 44-amino-acid analog of growth hormone-releasing hormone (GHRH), stabilized by a trans-3-hexenoyl N-terminal modification that resists enzymatic degradation. It is studied as a research tool for GHRH-receptor signaling and the growth-hormone / IGF-1 axis, and has a notable investigational history in visceral adipose tissue research.\n\nMolecular profile: Tesamorelin has a molecular weight of approximately 5135.9 g/mol (free base) or ~5196 g/mol (acetate salt) and molecular formula C221H366N72O67S (free base). It is synthesized as a 44-amino acid sequence bearing a trans-3-hexenoyl modification at the N-terminus for enhanced enzymatic stability compared to native GHRH(1-44). Supplied as a white lyophilized powder. [VERIFY salt form vs free base on COA]\n\nResearch focus areas: GHRH receptor signaling research · GH / IGF-1 axis pathway studies · Lipid and visceral adipose tissue models · Endocrine pathway research\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "CJC-1295 + Ipamorelin",
    wcId: 446,
    status: "draft",
    category: "Growth Pathway Research",
    shortDesc: "GH-secretagogue blend (GHRH analog + GHSR agonist) · Lyophilized · Research grade",
    price: 60,
    salePrice: 48,
    sizes: [], // simple product (5/5mg blend, fixed)
    longDesc:
      "This blend co-formulates CJC-1295 (Mod GRF 1-29), a 29-amino-acid GHRH analog, with Ipamorelin, a selective pentapeptide agonist of the ghrelin / GH-secretagogue receptor (GHSR). The two are studied together as complementary tools that act on two distinct receptor pathways involved in growth-hormone secretion.\n\nBlend composition: CJC-1295 (Mod GRF 1-29) 5mg — a 29-amino acid GHRH analog (CAS 446036-97-1, MW 3367.9 g/mol, sequence: Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln-Ser-Tyr-Arg-Lys-Val-Leu-Ala-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Leu-Ser-Arg). Ipamorelin 5mg — selective pentapeptide GHSR agonist (CAS 170851-70-4, MW 711.9 g/mol, sequence: Aib-His-D-2-Nal-D-Phe-Lys-NH2). Both components verified individually within the blend COA.\n\nResearch focus areas: Dual GHRH and GHSR pathway research · Pulsatile GH-release models · Pituitary signaling studies · GH-secretagogue comparative research\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "5-Amino-1MQ",
    wcId: 450,
    status: "draft",
    category: "Metabolic Research",
    shortDesc: "NNMT inhibitor · small molecule · Lyophilized · Research grade",
    price: 49,
    sizes: [
      { name: "5mg",  price: 49, salePrice: 45 },
      { name: "10mg", price: 64, salePrice: 58 },
    ],
    longDesc:
      "5-Amino-1MQ (5-amino-1-methylquinolinium) is a small-molecule, substrate-site-selective inhibitor of nicotinamide N-methyltransferase (NNMT), supplied as the iodide salt. It is studied in research on cellular methyl-donor balance, NAD+ salvage flux, and adipocyte metabolism. Unlike the peptides in this catalog it is a small molecule in an oral-oriented research format.\n\nMolecular profile: 5-Amino-1MQ has the molecular formula C10H11IN2 (iodide salt) with a molecular weight of 286.11 g/mol (salt), or approximately 159.21 g/mol for the free cation. CAS 42464-96-0 (iodide salt) [VERIFY salt form on COA]. Supplied as an off-white to pale crystalline powder. Stoichiometric note: ~1.89 mg iodide salt ≈ 1 mg of the 5-amino-1MQ cation.\n\nResearch focus areas: NNMT enzyme inhibition research · NAD+ salvage and cellular methyl-economy studies · Adipocyte lipogenesis models · Cellular bioenergetics research\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "Wolverine — BPC-157 + TB-500",
    wcId: 447,
    slug: "wolverine",
    status: "draft",
    category: "Repair & Recovery Research",
    shortDesc: "Repair blend (BPC-157 + TB-500) · Lyophilized · Research grade",
    price: 54,
    sizes: [
      { name: "5mg BPC-157 + 5mg TB-500", price: 54, salePrice: 42 },
      // TODO: Add 10mg/10mg variation after Ken confirms stock
    ],
    longDesc:
      "The Wolverine blend co-formulates BPC-157, a synthetic pentadecapeptide derived from a gastric protein sequence, with TB-500, the active fragment of thymosin β-4. Both are widely used research tools in tissue-repair, angiogenesis, and cell-migration models; the blend combines them in a single vial for combined research workflows.\n\nBlend composition: BPC-157 5mg — synthetic pentadecapeptide (CAS 137525-51-0, MW 1419.55 g/mol, sequence: Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val). TB-500 5mg — thymosin β-4 synthetic fragment (CAS 77591-33-4 [VERIFY — confirm fragment vs full Tβ4 on COA], MW ~4963 g/mol [VERIFY on COA]). Both components verified individually within the blend COA.\n\nResearch focus areas: Tissue repair and remodeling models · Angiogenesis research · Cell migration and actin-binding studies · Connective-tissue research\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  {
    name: "GLOW",
    wcId: 449,
    status: "draft",
    category: "Longevity & Cosmetic Research",
    shortDesc: "Cosmetic / repair blend (GHK-Cu + BPC-157 + TB-500) · Lyophilized · Research grade",
    price: 84,
    salePrice: 64,
    sizes: [], // simple product (70mg fixed)
    longDesc:
      "The GLOW blend co-formulates GHK-Cu (a copper-binding tripeptide), BPC-157, and TB-500. It is studied as a combined research tool spanning collagen and extracellular-matrix remodeling, skin / dermal research models, and tissue repair.\n\nBlend composition: GHK-Cu — copper tripeptide-1 (CAS 89030-95-5 complex / 49557-75-7 peptide [VERIFY on COA], MW ~340.8 g/mol, sequence: Gly-His-Lys copper-bound). BPC-157 — pentadecapeptide (CAS 137525-51-0, MW 1419.55 g/mol, sequence: Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val). TB-500 — thymosin β-4 fragment (CAS 77591-33-4 [VERIFY on COA]). Per-component mg split within the 70mg total to be confirmed with lab and listed on COA.\n\nResearch focus areas: Collagen and extracellular-matrix remodeling models · Skin and dermal research · Tissue repair and angiogenesis research · Copper-peptide signaling studies\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: "Bacteriostatic Water",
    wcId: 349,
    category: "Research Supplies",
    shortDesc: "0.9% benzyl alcohol · Sterile · 30mL multi-use vial",
    price: 15,
    sizes: [
      { name: "30mL × 1", price: 15 },
    ],
    longDesc:
      "Bacteriostatic water (BW) is sterile water for injection containing 0.9% benzyl alcohol as a preservative. The benzyl alcohol component inhibits microbial growth, allowing the vial to be used multiple times without contamination over a defined period. It is the standard reconstitution solvent used in peptide research laboratories for lyophilized peptide preparation prior to in vitro use.\n\nComposition: Aqueous solution containing water for injection (WFI) and benzyl alcohol (C7H8O) at 0.9% w/v concentration. Supplied in sealed 30mL multi-use glass vials. No active peptide or pharmaceutical ingredient.\n\nKey properties: Sterility certified · Multi-use format (benzyl alcohol prevents contamination between uses) · Compatible with all lyophilized peptide compounds in the Anvil catalog · Supplied as sealed glass vial\n\nFor in vitro research use only. Not for human or veterinary use.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wcFetch(endpoint, options = {}) {
  const url = `${WC_URL}/wp-json/wc/v3${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH,
      ...(options.headers || {}),
    },
  });
  return res;
}

async function wcJson(endpoint, options = {}) {
  const res = await wcFetch(endpoint, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw Object.assign(new Error(json.message || `HTTP ${res.status}`), {
      status: res.status,
      code: json.code,
      wcJson: json,
    });
  }
  return json;
}

function decodeHtml(str) {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

/** Get or create a WC category by name, returns { id } */
async function ensureCategory(name) {
  // WC returns HTML-encoded names (&amp; etc.) — decode before comparing
  // Use case-insensitive match: WC rejects duplicate names regardless of case
  const nameLower = name.toLowerCase();
  const cats = await wcJson(`/products/categories?per_page=100`);
  const existing = cats.find((c) => decodeHtml(c.name).toLowerCase() === nameLower);
  if (existing) return existing;

  try {
    return await wcJson("/products/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    // WC "term_exists" error includes the existing term's ID in err.wcJson.data.term_id
    if (err.wcJson?.data?.term_id) {
      return { id: err.wcJson.data.term_id, name };
    }
    // Fallback: re-fetch with case-insensitive match
    const retry = await wcJson(`/products/categories?per_page=100`);
    const found = retry.find((c) => decodeHtml(c.name).toLowerCase() === nameLower);
    if (found) return found;
    throw err;
  }
}

/** Search for a product by name (slug match), returns null if not found */
async function searchProductByName(name) {
  const results = await wcJson(
    `/products?search=${encodeURIComponent(name)}&per_page=5`
  );
  return results.find((p) => p.name === name) ?? null;
}

// ---------------------------------------------------------------------------
// Migration report row
// ---------------------------------------------------------------------------
const report = [];

function log(msg) {
  console.log(msg);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function migrateProduct(product) {
  const row = {
    name: product.name,
    wcIdBefore: product.wcId,
    wcIdAfter: null,
    type: product.sizes.length > 0 ? "variable" : "simple",
    variations: 0,
    status: "pending",
  };

  try {
    // Resolve category
    log(`\n[${product.name}] Resolving category: ${product.category}`);
    const cat = await ensureCategory(product.category);
    await sleep(300);

    // Build base payload
    const isVariable = product.sizes.length > 0;
    const basePayload = {
      name: product.name,
      ...(product.slug ? { slug: product.slug } : {}),
      type: isVariable ? "variable" : "simple",
      status: product.status || "publish",
      description: product.longDesc,
      short_description: product.shortDesc,
      categories: [{ id: cat.id }],
      regular_price: String(product.price),
      ...(product.salePrice ? { sale_price: String(product.salePrice) } : {}),
    };

    if (isVariable) {
      basePayload.attributes = [
        {
          name: "Size",
          visible: true,
          variation: true,
          options: product.sizes.map((s) => s.name),
        },
      ];
    }

    let wcId = product.wcId;

    // PUT (update) or POST (create)
    if (wcId !== null) {
      log(`[${product.name}] Updating existing product ID ${wcId}`);
      const updated = await wcJson(`/products/${wcId}`, {
        method: "PUT",
        body: JSON.stringify(basePayload),
      });
      wcId = updated.id;
      row.status = "updated";
    } else {
      // Search first in case it was created in a previous run
      log(`[${product.name}] Searching for existing product by name`);
      const found = await searchProductByName(product.name);
      await sleep(300);

      if (found) {
        log(`[${product.name}] Found existing ID ${found.id} — updating`);
        const updated = await wcJson(`/products/${found.id}`, {
          method: "PUT",
          body: JSON.stringify(basePayload),
        });
        wcId = updated.id;
        row.status = "updated (found by name)";
      } else {
        log(`[${product.name}] Creating new product`);
        const created = await wcJson("/products", {
          method: "POST",
          body: JSON.stringify(basePayload),
        });
        wcId = created.id;
        row.status = "created";
      }
    }

    row.wcIdAfter = wcId;
    await sleep(500);

    // Create/update variations
    if (isVariable) {
      log(`[${product.name}] Creating ${product.sizes.length} variation(s)`);

      // Fetch existing variations to avoid duplication
      const existingVars = await wcJson(`/products/${wcId}/variations?per_page=20`);
      await sleep(300);

      for (const size of product.sizes) {
        const existingVar = existingVars.find(
          (v) =>
            Array.isArray(v.attributes) &&
            v.attributes.some(
              (a) => a.name === "Size" && a.option === size.name
            )
        );

        const varPayload = {
          regular_price: String(size.price),
          ...(size.salePrice ? { sale_price: String(size.salePrice) } : {}),
          attributes: [{ name: "Size", option: size.name }],
          status: "publish",
        };

        if (existingVar) {
          await wcJson(`/products/${wcId}/variations/${existingVar.id}`, {
            method: "PUT",
            body: JSON.stringify(varPayload),
          });
          log(`  [${product.name}] Updated variation: ${size.name}`);
        } else {
          await wcJson(`/products/${wcId}/variations`, {
            method: "POST",
            body: JSON.stringify(varPayload),
          });
          log(`  [${product.name}] Created variation: ${size.name}`);
        }

        row.variations += 1;
        await sleep(500);
      }
    }

    log(`[${product.name}] Done — WC ID: ${wcId}`);
  } catch (err) {
    if (err.status === 401) {
      console.error(
        "\nFATAL: WooCommerce returned 401 Unauthorized.\n" +
          "Your API key is READ-ONLY and cannot create or update products.\n" +
          "Ask your hosting provider to regenerate the key with Read/Write permissions."
      );
      process.exit(1);
    }
    console.error(`[${product.name}] ERROR:`, err.message);
    row.status = `ERROR: ${err.message}`;
  }

  return row;
}

async function main() {
  console.log("=".repeat(70));
  console.log("Anvil Compounds — WooCommerce Product Migration");
  console.log(`Target: ${WC_URL}`);
  console.log("=".repeat(70));

  for (const product of PRODUCTS) {
    const row = await migrateProduct(product);
    report.push(row);
    await sleep(500);
  }

  // Print report table
  console.log("\n" + "=".repeat(70));
  console.log("MIGRATION REPORT");
  console.log("=".repeat(70));

  const col = (str, w) => String(str ?? "—").padEnd(w).slice(0, w);

  console.log(
    col("Product", 22) +
      col("ID Before", 11) +
      col("ID After", 10) +
      col("Type", 10) +
      col("Vars", 5) +
      "Status"
  );
  console.log("-".repeat(70));

  for (const row of report) {
    console.log(
      col(row.name, 22) +
        col(row.wcIdBefore, 11) +
        col(row.wcIdAfter, 10) +
        col(row.type, 10) +
        col(row.variations, 5) +
        row.status
    );
  }

  console.log("=".repeat(70));
  console.log(
    `Done. ${report.filter((r) => r.status.startsWith("ERROR")).length} error(s).`
  );
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
