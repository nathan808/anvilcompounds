// scripts/upload-product-images.js
// Run with: node --env-file=.env.local scripts/upload-product-images.js
//
// Uses WooCommerce REST API "src" approach: WC downloads the image from
// the Vercel URL and imports it into the media library automatically.
// WC consumer keys cannot authenticate against /wp/v2/media (WP core endpoint).

const PRODUCTS = [
  { file: 'anvil_vial_bpc157.jpg',      id: 332 },
  { file: 'anvil_vial_semaglutide.jpg', id: 334 },
  { file: 'anvil_vial_tirzepatide.jpg', id: 333 },
  { file: 'anvil_vial_retatrutide.jpg', id: 337 },
  { file: 'anvil_vial_ghkcu.jpg',       id: 336 },
  { file: 'anvil_vial_kglow.jpg',       id: 335 },
  { file: 'anvil_vial_tb500.jpg',       id: 354 },
  { file: 'anvil_vial_motsc.jpg',       id: 346 },
  { file: 'anvil_vial_bacwater.jpg',    id: 349 },
];

const WC_URL    = process.env.WC_URL;
const KEY       = process.env.WC_CONSUMER_KEY;
const SECRET    = process.env.WC_CONSUMER_SECRET;
const SITE_URL  = 'https://www.anvilcompounds.shop';

if (!WC_URL || !KEY || !SECRET) {
  console.error('Missing env vars. Run with: node --env-file=.env.local scripts/upload-product-images.js');
  process.exit(1);
}

const auth = 'Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64');

async function setProductImage(productId, imageUrl, filename) {
  const res = await fetch(`${WC_URL}/wp-json/wc/v3/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images: [{ src: imageUrl }] }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} — ${data.message || JSON.stringify(data)}`);
  }

  const img = data.images?.[0];
  if (!img?.src) throw new Error('Product updated but no image in response');

  return img.src;
}

async function verifyProduct(productId) {
  const res = await fetch(`${WC_URL}/wp-json/wc/v3/products/${productId}`, {
    headers: { 'Authorization': auth },
  });
  const data = await res.json();
  return data.images?.[0]?.src || null;
}

async function main() {
  console.log(`WC_URL: ${WC_URL}`);
  console.log(`Images source: ${SITE_URL}/images/\n`);

  const results = [];

  for (const { file, id } of PRODUCTS) {
    const imageUrl = `${SITE_URL}/images/${file}`;
    console.log(`Uploading ${file} → product ${id}...`);
    try {
      const src = await setProductImage(id, imageUrl, file);
      console.log(`  ✓ Product ${id} — image set: ${src}\n`);
      results.push({ id, file, success: true, src });
    } catch (err) {
      console.error(`  ✗ FAILED: product ${id} (${file}) — ${err.message}\n`);
      results.push({ id, file, success: false, error: err.message });
    }
  }

  console.log('--- VERIFICATION PASS ---');
  for (const { id, file, success } of results) {
    if (!success) {
      console.log(`  SKIP ${id} (${file}) — failed during upload`);
      continue;
    }
    try {
      const src = await verifyProduct(id);
      if (src) {
        console.log(`  ✓ Product ${id}: ${src}`);
      } else {
        console.log(`  ✗ Product ${id}: no image found`);
      }
    } catch (err) {
      console.log(`  ✗ Verify failed for ${id}: ${err.message}`);
    }
  }

  const passed = results.filter(r => r.success).length;
  console.log(`\nDone: ${passed}/${PRODUCTS.length} products updated.`);
}

main().catch(console.error);
