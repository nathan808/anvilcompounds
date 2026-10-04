# API References

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

No test suite exists. No `tsc --noEmit` script, but `npx tsc --noEmit` works for a manual type check.

## Environment Variables

Set in `.env.local` for local dev, and in the Vercel project settings for production. Never commit `.env*` (already gitignored).

| Variable | Purpose |
|---|---|
| `WC_URL` | WordPress's own stable Hostinger domain (`https://paleturquoise-crane-581984.hostingersite.com`) — **not** `anvilcompounds.shop`. See `docs/infrastructure.md` for why. |
| `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` | WooCommerce REST API credentials |
| `WC_WEBHOOK_SECRET` | HMAC verification for the `wc-order-status` webhook receiver — trim before comparing (a trailing newline from pasting into Vercel's env var field breaks every signature check with no visible symptom) |
| `META_CAPI_ACCESS_TOKEN` | Server-side Meta Conversions API |
| `NEXT_PUBLIC_META_PIXEL_ID` | Client-side Meta Pixel |
| `ANVIL_AUTH_SECRET` | HMAC secret for deriving the internal WP password from email+birthday |
| `GATE_SECRET` | Signs the age/research-access gate cookie — production's value differs from local, don't assume a locally-forged token works there |
| `RESEND_API_KEY` | Sends 2FA code emails (auth degrades gracefully if unset — code still stored, just not emailed). Not present in `.env.local` by default. |
| `OMNISEND_API_KEY` | Server-side Omnisend events (order placed, contact upsert) |
| `NEXT_PUBLIC_OMNISEND_BRAND_ID` | Enables the client-side Omnisend tracking snippet |
| `REVALIDATE_SECRET` | Auth for `POST /api/revalidate` — see `docs/infrastructure.md` for the WC-data cache-busting workflow |
| `ZELLE_ADDRESS`, `CASHAPP_HANDLE`, `CRYPTO_WALLET` | Displayed on the order-confirmation/payment page |

## WooCommerce REST API gotchas

- **`price` is read-only/computed — write `regular_price` and `sale_price` instead.** PUTting `{ regular_price, price }` directly silently no-ops on the actual displayed price, with no error (the response even echoes the old `price` back). Set `regular_price` (the "was" price) and `sale_price` (the active price — becomes the computed `price` and flips `on_sale: true` once below `regular_price`). Always re-fetch and diff against intended values after any price write — never trust a 200 response alone.
- **For a `type: "variable"` product, the parent's own `regular_price`/`price`/`sale_price` are blank/unusable.** Real pricing (and per-size `documentation_file`, stock) lives entirely on the variations (`GET /products/{id}/variations`). Check `type` before writing price/stock/doc-file data — don't assume "simple" from the product name.
- **Variation-level `manage_stock` defaults to `"parent"`** (a string) — that variation silently shares the parent's stock pool. Setting `stock_quantity` on a variation while `manage_stock` is still `"parent"` has no effect; also `PUT manage_stock: true` on that specific variation to isolate its stock.
- **ACF REST payload wrapper key is `acf`, not `fields`** on the WordPress core/ACF side (`legendresearch`'s convention — verify per-endpoint here too if writing ACF fields directly rather than through `meta_data`).
- **Renaming/re-slugging a product touches ~10-12 files**, all keyed by exact literal name/slug strings (nothing derived dynamically): `lib/woocommerce.ts` (`SLUG_TO_WC_ID`, `SLUG_TO_SDS`, `SLUG_TO_NAME`, `SLUG_TO_CATEGORY`, `RELATED_MAP`, `PRODUCT_BADGES`, `PRODUCT_PAGE_URLS` — this last one is dead code, never rendered, low priority to keep perfect — `LOCAL_PRODUCT_IMAGES`), `components/ProductsSection.tsx` (`SLUG_MAP`, `PRODUCT_IMAGES`, `LEADING_ROW_ORDER`, `POPULARITY_ORDER`, `HOME_HIDDEN_ON_ALL_COMPOUNDS`, `FALLBACK_PRODUCTS`), `components/CatalogTeaser.tsx` (`PREVIEW_SLUGS`), `app/page.tsx` (`PREVIEW_NAMES`), `KNOWN_SLUGS` in both `app/products/[slug]/page.tsx` and `app/coas/page.tsx`, `lib/productMechanisms.ts` (object keys), `app/sitemap.ts`, plus a `next.config.mjs` redirect for the old slug. Established convention: name-keyed maps keep every historical alias; slug-keyed maps get a clean rename + redirect.
- **WooCommerce webhooks are configured only in wp-admin, never in code** — but readable via `GET {WC_URL}/wp-json/wc/v3/webhooks` with the credentials above. See `docs/infrastructure.md` for the current list.

## WC order `meta_data` keys used by this app

`tracking_number` (guest/account order lookup, Report a Problem order-context), `tracking_carrier` (defaults to "USPS" if absent), `anvil_birthday`/`anvil_research_purpose`/`anvil_2fa_code`/`anvil_2fa_expiry` (customer meta, not order meta), `_meta_capi_purchase_sent` (idempotency flag set by the `wc-order-status` webhook after a Meta CAPI Purchase fires — WC re-fires the webhook on every order save, not just the on-hold→processing transition, so without this a paid order could double-report).

Report a Problem's `ISSUE_LABELS` (`lib/reportProblem.ts`) is the single source of truth for issue-type values shared between the client dropdown and server-side validation — always update both `lib/reportProblem.ts` and `lib/reportProblemClient.ts` together.
