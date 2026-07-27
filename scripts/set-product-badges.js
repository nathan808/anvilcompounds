#!/usr/bin/env node
/**
 * Anvil Compounds — Set Product Badge Attributes
 *
 * Writes the "Badge" custom attribute on each live WooCommerce product so
 * the catalog card badge (top-right corner of the product image) reflects
 * an intentional per-product label instead of the old rotating placeholder.
 * See lib/woocommerce.ts → PRODUCT_BADGES for the code-side fallback that
 * mirrors this same mapping.
 *
 * GETs each product first and merges "Badge" into its existing attributes
 * array (rather than replacing it wholesale) so Size/other attributes are
 * preserved.
 *
 * Run with: node scripts/set-product-badges.js
 * Safe to re-run — idempotent (updates the Badge option if already present).
 */

const fs   = require("fs");
const path = require("path");

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

if (!WC_URL || !process.env.WC_CONSUMER_KEY || !process.env.WC_CONSUMER_SECRET) {
  console.error("ERROR: Missing WC_URL / WC_CONSUMER_KEY / WC_CONSUMER_SECRET in .env.local");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wcJson(endpoint, opts = {}) {
  const res = await fetch(WC_URL + "/wp-json/wc/v3" + endpoint, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: AUTH, ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 200)}`); }
  if (!res.ok) throw Object.assign(new Error(json.message || `HTTP ${res.status}`), { status: res.status, wcJson: json });
  return json;
}

// wcId → badge label. Matches lib/woocommerce.ts PRODUCT_BADGES / the
// approved mapping (2026-07-27).
const BADGES = [
  { wcId: 332, label: "High Demand",         name: "BPC-157" },
  { wcId: 447, label: "Exclusive Blend",      name: "BPC-157 + TB-500 (Wolverine)" },
  { wcId: 354, label: "Recovery Staple",      name: "TB-500" },
  { wcId: 335, label: "Premium Blend",        name: "KLOW" },
  { wcId: 449, label: "Cosmetic Blend",       name: "GLOW" },
  { wcId: 336, label: "Entry Point",          name: "GHK-Cu" },
  { wcId: 333, label: "Dual Agonist",         name: "T1rz (GLP-TRZ)" },
  { wcId: 337, label: "Triple Agonist",       name: "R3ta (GLP-RT)" },
  { wcId: 346, label: "Metabolic",            name: "MOTS-c" },
  { wcId: 443, label: "Cellular Energy",      name: "NAD+" },
  { wcId: 446, label: "GH Blend",             name: "CJC-1295 + Ipamorelin" },
  { wcId: 445, label: "GHRH Research",        name: "Tesamorelin" },
  { wcId: 450, label: "Metabolic Support",    name: "5-Amino-1MQ" },
  { wcId: 510, label: "Neuropeptide",         name: "Semax" },
  { wcId: 511, label: "Anxiolytic Research",  name: "Selank" },
  { wcId: 349, label: "Essential Supply",     name: "Bacteriostatic Water" },
];

async function setBadge({ wcId, label, name }) {
  const product = await wcJson(`/products/${wcId}`);
  const existing = Array.isArray(product.attributes) ? product.attributes : [];

  const merged = existing.filter((a) => a.name.toLowerCase() !== "badge");
  merged.push({ name: "Badge", visible: true, variation: false, options: [label] });

  await wcJson(`/products/${wcId}`, {
    method: "PUT",
    body: JSON.stringify({ attributes: merged }),
  });

  return { wcId, name, label, prevBadge: existing.find((a) => a.name.toLowerCase() === "badge")?.options?.[0] ?? null };
}

async function main() {
  console.log(`Setting Badge attribute on ${BADGES.length} products at ${WC_URL}...\n`);
  const results = [];
  for (const entry of BADGES) {
    try {
      const r = await setBadge(entry);
      results.push({ ...r, status: "ok" });
      console.log(`✓ [${r.wcId}] ${r.name}: ${r.prevBadge ?? "(none)"} → ${r.label}`);
    } catch (err) {
      results.push({ wcId: entry.wcId, name: entry.name, label: entry.label, status: "error", error: err.message });
      console.error(`✗ [${entry.wcId}] ${entry.name}: ${err.message}`);
    }
    await sleep(400);
  }

  const failed = results.filter((r) => r.status === "error");
  console.log(`\nDone. ${results.length - failed.length}/${results.length} succeeded.`);
  if (failed.length) {
    console.log("Failed:", failed.map((f) => `${f.name} (${f.error})`).join(", "));
    process.exitCode = 1;
  }
}

main();
