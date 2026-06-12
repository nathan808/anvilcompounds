# Image Manifest — New SKUs (June 2026)

Drop files in `public/products/` using the exact filenames below.
After images are in place, remove the AWAITING IMAGE status and set the product to publish-ready (once COA is also live).

| Product | Slug | Expected Hero Filename | Expected Compound-Name PNG | WC Product ID | Status |
|---|---|---|---|---|---|
| NAD+ | nad-plus | nad-500mg-product-image.png | nad-plus-compound-name.png | 443 | AWAITING IMAGE |
| Tesamorelin | tesamorelin | tesamorelin-10mg-product-image.png | tesamorelin-compound-name.png | 445 | AWAITING IMAGE |
| CJC-1295 + Ipamorelin | cjc-1295-ipamorelin | cjc-ipa-5-5mg-product-image.png | cjc-1295-ipamorelin-compound-name.png | 446 | AWAITING IMAGE |
| 5-Amino-1MQ | 5-amino-1mq | 5-amino-1mq-product-image.png | 5-amino-1mq-compound-name.png | 450 | AWAITING IMAGE |
| Wolverine — BPC-157 + TB-500 | wolverine | wolverine-5-5mg-product-image.png | wolverine-compound-name.png | 447 | AWAITING IMAGE |
| GLOW | glow | glow-70mg-product-image.png | glow-compound-name.png | 449 | AWAITING IMAGE |

## How to use this file

1. Run `node scripts/migrate-products.js` — it prints a WC ID for each new product.
2. ~~Fill in the WC Product ID column above.~~ ✓ Done — IDs in table above.
3. ~~Update `lib/woocommerce.ts` → `SLUG_TO_WC_ID`.~~ ✓ Done.
4. ~~Update `scripts/populate-acf-fields.js` → set `wcId` for each new product.~~ ✓ Done.
5. ~~Run `node scripts/populate-acf-fields.js` to write all rich content to WooCommerce.~~ ✓ Done.
6. Drop the hero images (from vial renders) and compound-name PNGs into `public/products/`.
7. Update the `image` field in WooCommerce via the admin or upload script.
8. Publish only after: image ✓ + COA from Freedom Diagnostics ✓.

## Publish blockers per product (all currently DRAFT)

| Product | Image | COA | WC ID |
|---|---|---|---|
| NAD+ | AWAITING | AWAITING | AWAITING migration |
| Tesamorelin | AWAITING | AWAITING | AWAITING migration |
| CJC-1295 + Ipamorelin | AWAITING | AWAITING | AWAITING migration |
| 5-Amino-1MQ | AWAITING | AWAITING | AWAITING migration |
| Wolverine | AWAITING | AWAITING | AWAITING migration |
| GLOW | AWAITING | AWAITING | AWAITING migration |

## Wolverine 10/10mg variation — HOLD

The 10/10mg variation is **not created yet**. Ken must confirm stock before adding it.
When confirmed, add to `scripts/migrate-products.js` under Wolverine's `sizes` array:
```js
{ name: "10/10mg", price: TBD, salePrice: TBD }
```
Then re-run `migrate-products.js` (it will update the existing product, not create a duplicate).
