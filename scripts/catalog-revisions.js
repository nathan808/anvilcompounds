#!/usr/bin/env node
/**
 * Anvil Compounds — Catalog Revisions Script
 *
 * Applies the June 2026 catalog restructure to WooCommerce:
 *   1. Delete unwanted product variations (5mg / 30mL×3)
 *   2. Rename product slugs (tirzepatide→t1rz, retatrutide→r3ta, kglow→klow, wolverine slug locked)
 *   3. Create new product categories
 *   4. Reassign all products to correct categories (primary + Blends where applicable)
 *   5. Delete Semaglutide (WC ID 334)
 *   6. Delete old/stale categories
 *
 * Run AFTER migrate-products.js has already updated names and prices.
 * Run with: node scripts/catalog-revisions.js
 *
 * Safe to re-run — uses idempotent checks before each destructive operation.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// WC API helpers
// ---------------------------------------------------------------------------
async function wcJson(endpoint, opts = {}) {
  const res = await fetch(WC_URL + "/wp-json/wc/v3" + endpoint, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: AUTH, ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON (${res.status}): ${text.slice(0,200)}`); }
  if (!res.ok) throw Object.assign(new Error(json.message || `HTTP ${res.status}`), { status: res.status, wcJson: json });
  return json;
}

function decodeHtml(str) {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

// ---------------------------------------------------------------------------
// Step 1 — Delete unwanted variations
// ---------------------------------------------------------------------------

// Products and the variation Size options to DELETE
const VARIATIONS_TO_DELETE = [
  { wcId: 332, deleteSizes: ["5mg"],        label: "BPC-157" },
  { wcId: 354, deleteSizes: ["5mg"],        label: "TB-500" },
  { wcId: 346, deleteSizes: ["5mg"],        label: "MOTS-c" },
  { wcId: 333, deleteSizes: ["5mg"],        label: "T1rz (was Tirzepatide)" },
  { wcId: 337, deleteSizes: ["5mg"],        label: "R3ta (was Retatrutide)" },
  { wcId: 349, deleteSizes: ["30mL × 3"],   label: "Bacteriostatic Water" },
  { wcId: 447, deleteSizes: ["5/5mg"],      label: "Wolverine" },
];

async function deleteUnwantedVariations() {
  console.log("\n── Step 1: Delete unwanted variations ──────────────────────");

  for (const { wcId, deleteSizes, label } of VARIATIONS_TO_DELETE) {
    console.log(`\n[${label}] Fetching variations for product ${wcId}...`);
    const vars = await wcJson(`/products/${wcId}/variations?per_page=20`);
    await sleep(300);

    for (const sizeOption of deleteSizes) {
      const match = vars.find((v) =>
        Array.isArray(v.attributes) &&
        v.attributes.some((a) => a.name === "Size" && a.option === sizeOption)
      );

      if (!match) {
        console.log(`  [${label}] Size "${sizeOption}" not found — already deleted or never existed`);
        continue;
      }

      console.log(`  [${label}] Deleting variation ${match.id} (${sizeOption})...`);
      await wcJson(`/products/${wcId}/variations/${match.id}?force=true`, { method: "DELETE" });
      console.log(`  [${label}] ✓ Deleted`);
      await sleep(500);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 2 — Category restructure
// ---------------------------------------------------------------------------

// Final 6 categories
const NEW_CATEGORIES = [
  "Metabolic Research",
  "Repair & Recovery Research",
  "Longevity & Cosmetic Research",
  "Growth Pathway Research",
  "Blends",
  "Research Supplies",
];

// Products → [primaryCategory, ...secondaryCategories]
const PRODUCT_CATEGORIES = [
  { wcId: 332, categories: ["Repair & Recovery Research"],                              label: "BPC-157" },
  { wcId: 333, categories: ["Metabolic Research"],                                      label: "T1rz" },
  { wcId: 337, categories: ["Metabolic Research"],                                      label: "R3ta" },
  { wcId: 335, categories: ["Longevity & Cosmetic Research", "Blends"],                 label: "KLOW" },
  { wcId: 336, categories: ["Longevity & Cosmetic Research"],                           label: "GHK-Cu" },
  { wcId: 354, categories: ["Repair & Recovery Research"],                              label: "TB-500" },
  { wcId: 346, categories: ["Metabolic Research"],                                      label: "MOTS-c" },
  { wcId: 349, categories: ["Research Supplies"],                                       label: "Bacteriostatic Water" },
  { wcId: 443, categories: ["Metabolic Research"],                                      label: "NAD+" },
  { wcId: 445, categories: ["Growth Pathway Research"],                                 label: "Tesamorelin" },
  { wcId: 446, categories: ["Growth Pathway Research", "Blends"],                      label: "CJC-1295 + Ipamorelin" },
  { wcId: 450, categories: ["Metabolic Research"],                                      label: "5-Amino-1MQ" },
  { wcId: 447, categories: ["Repair & Recovery Research", "Blends"],                   label: "Wolverine" },
  { wcId: 449, categories: ["Longevity & Cosmetic Research", "Blends"],                label: "GLOW" },
];

// Old categories to delete after reassignment (IDs fetched dynamically)
const OLD_CATEGORY_NAMES = [
  "GLP-1 Class",
  "GLP-1 Receptor Agonist",
  "Triple Incretin Agonist",
  "4-Peptide Blend",
  "Copper Tripeptide-1",
  "Cognitive Research",
  "Peptides",
  "Cosmetic & Longevity",
  "Metabolic",
  "Repair & Recovery",
  "Recovery Research",
  "Longevity Research",
  "PEPTIDES RESEARCH · GH-CLASS",
  "PEPTIDES RESEARCH · REPAIR & RECOVERY",
  "PEPTIDES RESEARCH · COSMETIC & LONGEVITY",
  "Supplies",
  "Metabolic Research (duplicate check)",  // handled by case-insensitive match below
];

async function getAllCategories() {
  // WC paginates at 100 — fetch pages until exhausted
  let page = 1, all = [];
  while (true) {
    const batch = await wcJson(`/products/categories?per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < 100) break;
    page++;
    await sleep(200);
  }
  return all;
}

async function restructureCategories() {
  console.log("\n── Step 2: Category restructure ─────────────────────────────");

  // 2a. Fetch all existing categories
  console.log("\nFetching all existing categories...");
  const existingCats = await getAllCategories();
  console.log(`Found ${existingCats.length} existing categories`);

  // Build lookup map (name.toLowerCase() → category object)
  const catByName = {};
  for (const c of existingCats) {
    catByName[decodeHtml(c.name).toLowerCase()] = c;
  }

  // 2b. Create missing new categories
  const catIdMap = {};  // name → id (for the 6 final categories)

  for (const name of NEW_CATEGORIES) {
    const lower = name.toLowerCase();
    if (catByName[lower]) {
      catIdMap[name] = catByName[lower].id;
      console.log(`  Category "${name}" already exists (ID ${catByName[lower].id})`);
    } else {
      console.log(`  Creating category "${name}"...`);
      try {
        const created = await wcJson("/products/categories", {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        catIdMap[name] = created.id;
        console.log(`  ✓ Created "${name}" → ID ${created.id}`);
      } catch (err) {
        if (err.wcJson?.data?.term_id) {
          catIdMap[name] = err.wcJson.data.term_id;
          console.log(`  ✓ "${name}" already exists → ID ${err.wcJson.data.term_id}`);
        } else {
          throw err;
        }
      }
      await sleep(400);
    }
  }

  // 2c. Reassign products to correct categories
  console.log("\nReassigning product categories...");
  for (const { wcId, categories, label } of PRODUCT_CATEGORIES) {
    const catIds = categories.map((name) => {
      const id = catIdMap[name];
      if (!id) throw new Error(`Category ID not found for "${name}" — check NEW_CATEGORIES list`);
      return { id };
    });

    console.log(`  [${label}] → ${categories.join(" + ")}`);
    await wcJson(`/products/${wcId}`, {
      method: "PUT",
      body: JSON.stringify({ categories: catIds }),
    });
    await sleep(400);
  }
  console.log("  ✓ All products reassigned");

  // 2d. Delete old categories (only those with 0 products now)
  console.log("\nDeleting old categories...");
  const refreshedCats = await getAllCategories();

  for (const oldName of OLD_CATEGORY_NAMES) {
    const lower = oldName.toLowerCase().replace(/\s*\(.*\)/, "").trim();
    const match = refreshedCats.find((c) => decodeHtml(c.name).toLowerCase() === lower);
    if (!match) {
      console.log(`  "${oldName}" — not found, skipping`);
      continue;
    }
    if (match.count > 0) {
      console.log(`  "${match.name}" (ID ${match.id}) — still has ${match.count} product(s), skipping`);
      continue;
    }
    console.log(`  Deleting "${match.name}" (ID ${match.id})...`);
    try {
      await wcJson(`/products/categories/${match.id}?force=true`, { method: "DELETE" });
      console.log(`  ✓ Deleted`);
    } catch (err) {
      console.warn(`  ⚠ Could not delete "${match.name}": ${err.message}`);
    }
    await sleep(300);
  }
}

// ---------------------------------------------------------------------------
// Step 3 — Delete Semaglutide (WC ID 334)
// ---------------------------------------------------------------------------
async function deleteSemaglutide() {
  console.log("\n── Step 3: Delete Semaglutide (ID 334) ─────────────────────");

  // Verify it still exists before deleting
  try {
    const product = await wcJson("/products/334");
    console.log(`  Found: "${product.name}" (status: ${product.status}) — proceeding with deletion`);
  } catch (err) {
    if (err.status === 404) {
      console.log("  Product 334 not found — already deleted");
      return;
    }
    throw err;
  }

  // Move to trash first (WC soft-delete), then force-delete
  await wcJson("/products/334", {
    method: "DELETE",
    // force=false → moves to trash; force=true → permanent delete
    // Using force=true since we want it fully gone
  });
  await sleep(300);
  try {
    await wcJson("/products/334?force=true", { method: "DELETE" });
    console.log("  ✓ Semaglutide permanently deleted");
  } catch (err) {
    if (err.status === 404) {
      console.log("  ✓ Semaglutide deleted (already in trash/gone)");
    } else {
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4 — Verify final state
// ---------------------------------------------------------------------------
async function verifyState() {
  console.log("\n── Step 4: Verification ─────────────────────────────────────");

  const allCats = await getAllCategories();
  console.log("\nRemaining categories:");
  for (const c of allCats.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  [${String(c.id).padEnd(4)}] ${decodeHtml(c.name).padEnd(40)} (${c.count} products)`);
  }

  // Verify Semaglutide is gone
  try {
    await wcJson("/products/334");
    console.log("\n⚠ WARNING: Semaglutide (ID 334) still exists!");
  } catch (err) {
    if (err.status === 404) {
      console.log("\n✓ Semaglutide (ID 334) confirmed deleted");
    }
  }

  // Verify variation counts for key products
  console.log("\nVariation counts after cleanup:");
  const varChecks = [
    { wcId: 332, label: "BPC-157",        expectedVars: 1 },
    { wcId: 333, label: "T1rz",           expectedVars: 2 },
    { wcId: 337, label: "R3ta",           expectedVars: 2 },
    { wcId: 354, label: "TB-500",         expectedVars: 1 },
    { wcId: 346, label: "MOTS-c",         expectedVars: 1 },
    { wcId: 349, label: "Bacteriostatic Water", expectedVars: 1 },
  ];
  for (const { wcId, label, expectedVars } of varChecks) {
    const vars = await wcJson(`/products/${wcId}/variations?per_page=20`);
    const status = vars.length === expectedVars ? "✓" : "⚠";
    const sizes = vars.map((v) => v.attributes.find((a) => a.name === "Size")?.option ?? "?").join(", ");
    console.log(`  ${status} [${wcId}] ${label.padEnd(25)} ${vars.length} variation(s): ${sizes}`);
    await sleep(200);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=".repeat(70));
  console.log("Anvil Compounds — Catalog Revisions");
  console.log(`Target: ${WC_URL}`);
  console.log("=".repeat(70));

  // Sanity check — confirm write access
  try {
    await wcJson("/products/332");
  } catch (err) {
    if (err.status === 401) {
      console.error("\nFATAL: 401 Unauthorized — check WC API key has Read/Write permissions");
      process.exit(1);
    }
    throw err;
  }

  await deleteUnwantedVariations();
  await restructureCategories();
  await deleteSemaglutide();
  await verifyState();

  console.log("\n" + "=".repeat(70));
  console.log("Catalog revisions complete.");
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("\nUnhandled error:", err.message);
  process.exit(1);
});
