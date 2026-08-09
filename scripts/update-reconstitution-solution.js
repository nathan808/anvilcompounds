// scripts/update-reconstitution-solution.js
// Run with: node --env-file=.env.local scripts/update-reconstitution-solution.js
//
// One-off: changes the Reconstitution Solution (WC product 349, slug
// bacteriostatic-water) from its single "30mL x 1" variation to "3mL x 1" —
// same variation id (350), which is also the hardcoded free-gift variation
// bundled into every BOGO order (lib/bogoDiscount.ts), so this changes what
// size that free gift is too. Price stays $9. Also updates the product's
// description/short_description text, which mentioned 30mL directly.
//
// Already run — kept for reference. If node's fetch throws ECONNRESET
// repeatedly (a sandbox-specific quirk, not a real outage), fall back to the
// equivalent curl --ipv4 calls instead of retrying this script indefinitely.

const WC_URL = process.env.WC_URL;
const KEY = process.env.WC_CONSUMER_KEY;
const SECRET = process.env.WC_CONSUMER_SECRET;

if (!WC_URL || !KEY || !SECRET) {
  console.error("Missing env vars. Run with: node --env-file=.env.local scripts/update-reconstitution-solution.js");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");
const PRODUCT_ID = 349;
const VARIATION_ID = 350;

async function wc(path, options = {}, retries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${WC_URL}/wp-json/wc/v3${path}`, {
        ...options,
        headers: { Authorization: auth, "Content-Type": "application/json", ...options.headers },
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

async function main() {
  console.log("Fetching current product...");
  const product = await wc(`/products/${PRODUCT_ID}`);

  const newDescription = product.description.replaceAll("30mL", "3mL");
  const newShortDescription = product.short_description.replaceAll("30mL", "3mL");
  const newAttributes = product.attributes.map((attr) =>
    attr.name === "Size" ? { ...attr, options: attr.options.map((o) => o.replace("30mL", "3mL")) } : attr
  );

  console.log("Updating product (attributes + description)...");
  await wc(`/products/${PRODUCT_ID}`, {
    method: "PUT",
    body: JSON.stringify({
      description: newDescription,
      short_description: newShortDescription,
      attributes: newAttributes,
    }),
  });

  console.log("Updating variation (Size: 30mL x 1 -> 3mL x 1)...");
  await wc(`/products/${PRODUCT_ID}/variations/${VARIATION_ID}`, {
    method: "PUT",
    body: JSON.stringify({
      attributes: [{ name: "Size", option: "3mL × 1" }],
    }),
  });

  console.log("Verifying...");
  const verifyProduct = await wc(`/products/${PRODUCT_ID}`);
  const verifyVariation = await wc(`/products/${PRODUCT_ID}/variations/${VARIATION_ID}`);
  console.log("Product attributes:", JSON.stringify(verifyProduct.attributes.find((a) => a.name === "Size")));
  console.log("Variation attributes:", JSON.stringify(verifyVariation.attributes));
  console.log("Variation price:", verifyVariation.price);
  console.log("Short description:", verifyProduct.short_description);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
