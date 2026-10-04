# Architecture

## Headless WooCommerce is the spine

Almost everything server-side funnels through Basic Auth (`WC_CONSUMER_KEY`/`WC_CONSUMER_SECRET`) against `${WC_URL}/wp-json/wc/v3/...` — see `docs/infrastructure.md` for what `WC_URL` actually points at and why.

- `lib/woocommerce.ts` — product catalog + product-detail fetching. Two parallel concerns:
  - `getProducts()`/`mapProduct()` — catalog grid cards (`components/ProductsSection.tsx`).
  - `getProductPageData()` — full product page data (`app/products/[slug]/page.tsx` → `components/ProductPageTemplate.tsx`, and `app/coas/[slug]/page.tsx`), including parsing ACF repeater meta back out with `parseRepeater()`. For a `type: "variable"` product, per-size fields (price, stock, `documentation_file`) live on the **variations**, not the parent resource — see `docs/api-references.md`.
  - **Slug ⇄ WooCommerce numeric ID mapping is hardcoded** in `SLUG_TO_WC_ID` (plus `SLUG_TO_NAME`, `SLUG_TO_CATEGORY`, `SLUG_TO_ICON`, `RELATED_MAP`, `SLUG_TO_SDS`, `SLUG_TO_MOLECULE_IMAGE`). When a product is added in WooCommerce, it must also be added here *and* to `KNOWN_SLUGS` in `app/products/[slug]/page.tsx` and `app/coas/page.tsx`, *and* to `LOCAL_PRODUCT_IMAGES`/`PRODUCT_IMAGES`. `image-manifest.md` tracks which new SKUs are still missing images/COA and are therefore DRAFT-only.
- `app/api/orders/route.ts` — creates a WooCommerce order (`status: "on-hold"`, `payment_method: "bacs"`). No card processing; payment is manual (Zelle/CashApp/ACH/crypto), settled offline, order sits on-hold until confirmed. Verbose `[orders:<id>]`-prefixed console logging exists here on purpose — order creation has been a recurring debugging target.
- `app/api/orders/[id]/route.ts` and `app/api/orders/debug/route.ts` — read-back endpoints for diagnosing order issues in production.
- `app/api/webhooks/wc-order-status/route.ts` — WooCommerce webhook receiver (HMAC-verified via `WC_WEBHOOK_SECRET`), fires Meta CAPI Purchase events. See `docs/infrastructure.md` for the full webhook list and Meta integration.
- `wordpress/` — the PHP/ACF side: `acf-field-group.json` (importable ACF field group) and `acf-rest-api.php` (exposes ACF fields over REST). Install on the WordPress backend, not this Next.js app.

## Auth is custom, not standard WordPress login

`lib/authContext.tsx` + `app/api/auth/*` implement a bespoke flow on top of WooCommerce customers and the JWT Auth plugin — there's no password the user ever sets or sees:
1. **Register** (`api/auth/register`) — creates a WC customer; the WP "password" is `derivePassword()`, an HMAC-SHA256 of `email:birthday` (never stored/transmitted as typed). Birthday and "research purpose" stored as WC customer meta (`anvil_birthday`, `anvil_research_purpose`).
2. **Login** (`api/auth/login`) — looks up the customer by email, checks submitted birthday against stored `anvil_birthday` meta, re-derives the same password to fetch a JWT from `/wp-json/jwt-auth/v1/token`. Birthday is effectively the password.
3. **2FA** (`api/auth/send-2fa`, `api/auth/verify-2fa`) — OTP generated server-side, stored in WC customer meta (`anvil_2fa_code`/`anvil_2fa_expiry`), emailed via Resend (`RESEND_API_KEY`). Always returns `{success:true}` on send regardless of whether the email exists, to avoid enumeration.
4. Resulting JWT + profile stored client-side in `localStorage` (`anvil_auth`) by `AuthProvider`; `isAuthenticated` also checks JWT expiry client-side by decoding the payload.

Checkout (`app/checkout/page.tsx`) requires `isAuthenticated` and redirects to `/account?redirect=/checkout` otherwise.

**Age/research-access gate** (separate from login): `anvil_gate` cookie, signed HMAC via `lib/gateAuth.ts` + `GATE_SECRET`, 30-day expiry, required by middleware before `/api/products` or most pages return real content. Production's `GATE_SECRET` does not match the local `.env.local` value — a locally-forged token won't work against production; test gated routes there with a real browser session.

## Cart

`lib/cartContext.tsx` is plain React Context + `localStorage` (`anvil_cart`, 30-day expiry via `anvil_cart_saved_at`) — no server cart. Adding an item also fires a fire-and-forget `POST /api/track` Omnisend event; cart mutations never block on network.

## Email marketing (Omnisend)

- Client-side page-view + add-to-cart tracking snippet injected in `app/layout.tsx` only when `NEXT_PUBLIC_OMNISEND_BRAND_ID` is set.
- Server-side, `app/api/orders/route.ts` fires `Order Placed` events and upserts the contact with a `customer` tag after a successful order — wrapped in `Promise.allSettled` so Omnisend failures never fail the order.
- `app/api/track/route.ts` is the generic event-proxy endpoint the client calls.

## Blog

Independent of WooCommerce — `app/api/blog/route.ts` and `app/api/blog/[slug]/route.ts` read directly from WordPress core's REST API (`/wp-json/wp/v2/posts`, `_embed` for featured image/categories) against `WC_URL` (WordPress's stable hostingersite.com domain — see `docs/infrastructure.md`), not the storefront domain.

## Payment details

`lib/paymentConfig.ts` centralizes the manual payment instructions (Zelle, CashApp, Apple Cash, ACH, crypto via NOWPayments) shown on the order-confirmation page. Values come from env vars with `"TO_BE_CONFIGURED"` placeholders — check this file before assuming a payment method is live.

## Catalog sync scripts

`scripts/`, run with plain `node`, read WC credentials from `.env.local` — the only way to change product data short of wp-admin, since there's no admin UI in this repo:
- `node scripts/migrate-products.js` — create/update WooCommerce products from data hardcoded in the script (idempotent — matches on product name/slug).
- `node scripts/populate-acf-fields.js` — writes long-form page content into WC product `meta_data` using ACF's repeater format (`{field}_{index}_{subfield}`). How `ProductPageTemplate` gets its rich content.
- `node scripts/catalog-revisions.js` — one-off historical migration (slug renames, category restructure). Reference for pattern, not routinely re-run.
- `node scripts/upload-product-images.js` — pushes images into the WP media library via WC's `src` URL-import approach (WC keys can't auth against `/wp/v2/media` directly).
