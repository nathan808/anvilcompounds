# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Next.js 14 (App Router) storefront for **Anvil Compounds** (anvilcompounds.shop) — a research peptide vendor in Southern California. It's a **headless frontend backed by a WordPress + WooCommerce REST API**. WordPress/WooCommerce is the system of record for products, customers, and orders; this repo only renders UI and calls the WC REST API server-side.

Live: products, custom auth, cart, manual-payment checkout, blog, and Omnisend email tracking are all wired up and working — this is not a static prototype.

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

No test suite exists. There is no `tsc --noEmit` script, but `npx tsc --noEmit` works for a manual type check.

**Catalog sync scripts** (`scripts/`, run with plain `node`, read WC credentials from `.env.local`):
- `node scripts/migrate-products.js` — create/update WooCommerce products from the data hardcoded in the script (idempotent — matches on product name/slug).
- `node scripts/populate-acf-fields.js` — writes long-form page content (research applications, properties table, documentation metrics, etc.) into WooCommerce product `meta_data` using ACF's repeater field format (`{field}_{index}_{subfield}`). This is how `ProductPageTemplate` gets its rich content.
- `node scripts/catalog-revisions.js` — one-off historical migration (slug renames, category restructure). Reference for pattern, not routinely re-run.
- `node scripts/upload-product-images.js` — pushes images into the WP media library via WC's `src` URL-import approach (WC keys can't auth against `/wp/v2/media` directly).

These scripts are the only way to change product data short of the WP admin — there is no admin UI in this repo.

## Architecture

### Headless WooCommerce is the spine
Almost everything server-side funnels through Basic Auth (`WC_CONSUMER_KEY`/`WC_CONSUMER_SECRET`) against `${WC_URL}/wp-json/wc/v3/...`:
- `lib/woocommerce.ts` — product catalog + product-detail fetching. Two parallel concerns live here:
  - `getProducts()`/`mapProduct()` — catalog grid cards (`components/ProductsSection.tsx`).
  - `getProductPageData()` — full product page data (`app/products/[slug]/page.tsx` → `components/ProductPageTemplate.tsx`), including parsing ACF repeater meta back out with `parseRepeater()`.
  - **Slug ⇄ WooCommerce numeric ID mapping is hardcoded** in `SLUG_TO_WC_ID` (plus `SLUG_TO_NAME`, `SLUG_TO_CATEGORY`, `SLUG_TO_ICON`, `RELATED_MAP`). When a product is added in WooCommerce, it must also be added here *and* to `KNOWN_SLUGS` in `app/products/[slug]/page.tsx` *and* to `LOCAL_PRODUCT_IMAGES`. `image-manifest.md` tracks which new SKUs are still missing images/COA and are therefore DRAFT-only.
- `app/api/orders/route.ts` — creates a WooCommerce order (`status: "on-hold"`, `payment_method: "bacs"`). There is no card processing; payment is manual (Zelle/CashApp/ACH/crypto), settled offline, and the order sits on-hold until confirmed. Verbose `[orders:<id>]`-prefixed console logging exists here on purpose — order creation has been a recurring debugging target (see git history).
- `app/api/orders/[id]/route.ts` and `app/api/orders/debug/route.ts` — read-back endpoints used for diagnosing order issues in production.
- `wordpress/` — the PHP/ACF side: `acf-field-group.json` (importable ACF field group) and `acf-rest-api.php` (exposes ACF fields over REST). These need to be installed on the WordPress backend, not this Next.js app.

### Auth is custom, not standard WordPress login
`lib/authContext.tsx` + `app/api/auth/*` implement a bespoke flow on top of WooCommerce customers and the JWT Auth plugin — there's no password the user ever sets or sees:
1. **Register** (`api/auth/register`) — creates a WC customer; the WP "password" is `derivePassword()`, an HMAC-SHA256 of `email:birthday` (never stored or transmitted as typed by the user). Birthday and "research purpose" are stored as WC customer meta (`anvil_birthday`, `anvil_research_purpose`).
2. **Login** (`api/auth/login`) — looks up the customer by email, checks the submitted birthday against stored `anvil_birthday` meta, then re-derives the same password to fetch a JWT from `/wp-json/jwt-auth/v1/token`. Birthday is effectively the password.
3. **2FA** (`api/auth/send-2fa`, `api/auth/verify-2fa`) — OTP is generated server-side, stored in WC customer meta (`anvil_2fa_code`/`anvil_2fa_expiry`), and emailed via Resend (`RESEND_API_KEY`). Always returns `{success:true}` on send regardless of whether the email exists, to avoid enumeration.
4. The resulting JWT + profile is stored client-side in `localStorage` (`anvil_auth`) by `AuthProvider`; `isAuthenticated` also checks JWT expiry client-side by decoding the payload.

Checkout (`app/checkout/page.tsx`) requires `isAuthenticated` and redirects to `/account?redirect=/checkout` otherwise.

### Cart
`lib/cartContext.tsx` is plain React Context + `localStorage` (`anvil_cart`, 30-day expiry via `anvil_cart_saved_at`) — no server cart, no Zustand. Adding an item also fires a fire-and-forget `POST /api/track` Omnisend event; cart mutations never block on network.

### Email marketing (Omnisend)
- Client-side page-view + add-to-cart tracking snippet is injected in `app/layout.tsx` only when `NEXT_PUBLIC_OMNISEND_BRAND_ID` is set.
- Server-side, `app/api/orders/route.ts` fires `Order Placed` events and upserts the contact with a `customer` tag after a successful order — wrapped in `Promise.allSettled` so Omnisend failures never fail the order.
- `app/api/track/route.ts` is the generic event-proxy endpoint the client calls.

### Blog
Independent of WooCommerce — `app/api/blog/route.ts` and `app/api/blog/[slug]/route.ts` read directly from WordPress core's REST API (`/wp-json/wp/v2/posts`, `_embed` for featured image/categories), not WooCommerce.

### Payment details
`lib/paymentConfig.ts` centralizes the manual payment instructions (Zelle, CashApp, Apple Cash, ACH, crypto via NOWPayments) shown on the order-confirmation page. Values come from env vars with `"TO_BE_CONFIGURED"` placeholders — check this file before assuming a payment method is live.

## Environment Variables

Set in `.env.local` for local dev, and in the Vercel project settings for production. Never commit `.env*` (already gitignored).

| Variable | Purpose |
|---|---|
| `WC_URL` | WordPress site base URL (no trailing slash) |
| `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` | WooCommerce REST API credentials |
| `ANVIL_AUTH_SECRET` | HMAC secret for deriving the internal WP password from email+birthday |
| `RESEND_API_KEY` | Sends 2FA code emails (auth degrades gracefully if unset — code is still stored, just not emailed) |
| `OMNISEND_API_KEY` | Server-side Omnisend events (order placed, contact upsert) |
| `NEXT_PUBLIC_OMNISEND_BRAND_ID` | Enables the client-side Omnisend tracking snippet |
| `ZELLE_ADDRESS`, `CASHAPP_HANDLE`, `CRYPTO_WALLET` | Displayed on the order-confirmation/payment page |

## Design System

| Token | Value |
|---|---|
| `navy-950` (darkest bg) | `#04091A` |
| `navy-900` (section bg) | `#0A1628` |
| `navy-800` (card bg) | `#0D1F3C` |
| `blue-600` (primary accent) | `#1D6ADB` |
| `blue-400` (light accent) | `#4D94F0` |
| `ice` (light section bg) | `#EEF4FF` |
| `font-display` | Syne |
| `font-body` | DM Sans |
| `font-mono` | DM Mono |

Fonts are loaded via `next/font/google` in `app/layout.tsx`. Most custom CSS/utility classes (glassmorphism cards, mesh backgrounds, etc.) live in `app/globals.css` rather than Tailwind config.

## Business Context

- Products are framed strictly as **research compounds, "for in vitro/laboratory research use only," 21+** — every checkout flow includes RUO consent (`ruoConfirmed` is recorded as order meta with timestamp + IP).
- USP is independent triple-method testing: HPLC + Mass Spectrometry + Endotoxin screening.
- Same-day shipping if ordered before 12PM PST; USPS Priority, 2–3 days domestic.
- Support: support@anvilcompounds.shop.
- Catalog and pricing change relatively often (see `image-manifest.md` for SKUs currently blocked from publishing on missing images/COA) — always check `lib/woocommerce.ts` and the live WC admin rather than assuming the product list here is exhaustive.

## Working Notes

- The client (Ken) is non-technical (GitHub Desktop only, no terminal) and communicates through Claude Code — keep explanations concise and non-jargon-heavy when the audience is Ken rather than another engineer.
- `.claude/settings.local.json` is gitignored on purpose (it has held local credentials in the past — see commit `c2ce5e6`). Don't add secrets to any tracked file.
- Branches in this repo tend to be short-lived feature branches per fix (e.g. `diagnose-orders`, `crypto-checkout`, `on-hold-status`) merged into `main`.
