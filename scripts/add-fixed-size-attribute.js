#!/usr/bin/env node
/**
 * Anvil Compounds — Add a fixed single-option "Size" attribute
 *
 * These five products are simple (non-variable) WooCommerce products with a
 * fixed mg total but no "Size" attribute set, so neither the catalog card's
 * mg pills nor the product page's Reconstitution Guide can read a size for
 * them. This adds a single-option Size attribute (not a variation) so both
 * features pick it up from the base product response.
 *
 * Run with: node scripts/add-fixed-size-attribute.js
 * Reads WC credentials from .env.local.
 */

const fs = require("fs");
const path = require("path");

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

const WC_URL = (process.env.WC_URL || "").replace(/\/$/, "");
const KEY = process.env.WC_CONSUMER_KEY;
const SECRET = process.env.WC_CONSUMER_SECRET;

if (!WC_URL || !KEY || !SECRET) {
  console.error("ERROR: Missing WC_URL / WC_CONSUMER_KEY / WC_CONSUMER_SECRET in .env.local");
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(KEY + ":" + SECRET).toString("base64");

const TARGETS = [
  { wcId: 335, name: "KLOW", size: "80mg" },
  { wcId: 449, name: "GLOW", size: "70mg" },
  { wcId: 443, name: "NAD+", size: "500mg" },
  { wcId: 445, name: "Tesamorelin", size: "10mg" },
  { wcId: 446, name: "CJC-1295 + Ipamorelin", size: "5mg/5mg" },
];

async function main() {
  for (const t of TARGETS) {
    const getRes = await fetch(`${WC_URL}/wp-json/wc/v3/products/${t.wcId}`, {
      headers: { Authorization: AUTH },
    });
    if (!getRes.ok) {
      console.error(`✗ ${t.name} (${t.wcId}): fetch failed — ${getRes.status}`);
      continue;
    }
    const product = await getRes.json();

    const existingAttrs = (product.attributes || []).filter(
      (a) => a.name.toLowerCase() !== "size"
    );
    const attributes = [
      ...existingAttrs,
      { name: "Size", visible: true, variation: false, options: [t.size] },
    ];

    const putRes = await fetch(`${WC_URL}/wp-json/wc/v3/products/${t.wcId}`, {
      method: "PUT",
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ attributes }),
    });

    if (!putRes.ok) {
      const body = await putRes.text();
      console.error(`✗ ${t.name} (${t.wcId}): update failed — ${putRes.status} ${body}`);
      continue;
    }

    console.log(`✓ ${t.name} (${t.wcId}): Size = ${t.size}`);
  }
}

main();
