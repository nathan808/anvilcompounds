# Infrastructure

## Domain routing (migrated 2026-09-03)

`anvilcompounds.shop` **and** `www.anvilcompounds.shop` both resolve to Vercel (the Next.js app in this repo) — apex 308-redirects to `www`. Before 2026-09-03 the apex served WordPress directly while only `www` served this app; if any older note or memory says otherwise, it's stale.

- Apex `@` A record → `216.198.79.1` (Vercel). No `AAAA` record (removed — a leftover one would let IPv6 clients bypass the fix).
- `www` CNAME → Vercel's given target (already correct before this migration).
- Mail (MX, DKIM CNAMEs, SPF/DMARC TXT) untouched, still on Hostinger.
- WordPress itself was **not** moved — Hostinger's plan for this account doesn't support adding a new subdomain (unlike the sibling `legendresearch.info` project, which does support one and uses `cms.legendresearch.info`).

## `WC_URL` points at WordPress's own stable Hostinger domain, not the storefront domain

`WC_URL=https://paleturquoise-crane-581984.hostingersite.com` (local `.env.local` + Vercel Production/Preview). This is Hostinger's own default/permanent domain for this hosting account — resolves to the same WordPress+WooCommerce install regardless of what `anvilcompounds.shop` DNS does. It was already relied on before this migration for `wp-content`/`wp-includes` asset proxying (`next.config.mjs` `rewrites()`), which is what led to using it as `WC_URL`'s new value too, since a new subdomain wasn't an option.

Everything server-side that needs WordPress/WooCommerce goes through `WC_URL` — product data, orders, JWT auth, `app/api/blog/*`, `app/legal/[slug]/page.tsx`. If `WC_URL` (or any hardcoded WordPress reference) ever needs to move again, reach for this same hostingersite.com domain first.

## ⚠️ Hostinger's edge layer silently rewrites `anvilcompounds.shop` in API responses

Since the domain migration, Hostinger's platform live-rewrites **any WordPress API response body containing the literal string `anvilcompounds.shop`** to the `hostingersite.com` domain — tied to hPanel showing that domain as "not connected" to this hosting account. This broke every product's `documentation_file` (COA link) meta after the migration, on every read, indefinitely — not a one-time DB change, a live rewrite.

**Confirmed via a controlled test**: an unrelated domain (`example.com`) in an unrelated meta field round-tripped untouched; anything containing `anvilcompounds.shop` never did, regardless of field name.

**Workaround in place**: any WordPress-stored value that needs to reference this app's own domain uses `anvilcompounds.vercel.app` instead of `anvilcompounds.shop` — same Vercel deployment, same files, a hostname the rewrite doesn't touch. See `documentation_file` values on all 13 products (fixed 2026-09-03/04) as the working example.

**Also watch for**: variable products (multi-size, e.g. AC2T/AC3R) store `documentation_file` **per variation**, which overrides the parent product's value — a parent-only fix silently misses these. Always check `GET {WC_URL}/wp-json/wc/v3/products/{id}/variations` too, not just the parent resource, when auditing/fixing this kind of field.

## WooCommerce webhooks (configured in wp-admin only, not in code)

Live and readable via `GET {WC_URL}/wp-json/wc/v3/webhooks` with the same REST credentials already in `.env.local` — faster than asking to check wp-admin. As of 2026-09-03, 9 active webhooks:
- `order.updated` → this app's own `app/api/webhooks/wc-order-status/route.ts` (fires Meta CAPI Purchase events on payment confirmation — see that file's own comments for why it's gated on status transition, not order creation)
- `order.created` → Zapier
- `product.created`/`product.updated`/`product.deleted`, `customer.created`/`customer.updated`, `order.created`/`order.updated` → Omnisend
- `product.deleted` → Klaviyo

None point at the bare apex domain — all use `www.anvilcompounds.shop` or an external service, so the domain migration didn't require touching any of them.

## Meta Pixel / Conversions API

- **Pixel** (client-side): loaded in `app/layout.tsx`, gated on `NEXT_PUBLIC_META_PIXEL_ID`. Fires only on this Next.js app — never touches WordPress.
- **CAPI** (server-side): `lib/metaCapi.ts`, triggered *only* from the `wc-order-status` webhook receiver above (not from order creation) — see that route for the on-hold→processing gating logic. `event_source_url` is hardcoded to `https://www.anvilcompounds.shop/checkout/confirmation`.

## Deploy

```bash
npx vercel deploy --prod --yes   # from this directory; aliases to www.anvilcompounds.shop automatically
```

This deploys local files directly regardless of git branch/state — doesn't depend on which branch is checked out. Separately, an **older, unverified-this-session note** exists that GitHub-push-triggered deploys ran off a `nextauth-google-phone` branch rather than `main` — if deploying via `git push` rather than the Vercel CLI, confirm the production branch in Vercel project settings before assuming `main` is live.

## Cache busting after any WooCommerce data change

WooCommerce product/blog data is cached for 1 hour in this app (`revalidate: 3600`, tags `wc-products`/`wp-posts` in `lib/woocommerce.ts`). **A deploy does not clear this.** After any live product/blog data change (via script, WC admin, or direct API write), immediately:

```bash
curl -X POST "https://www.anvilcompounds.shop/api/revalidate?secret=$REVALIDATE_SECRET"
```

If a fix still doesn't appear to have taken after busting the cache, don't assume it's fixed just because the API returns the right value — the real rendered page may be behind additional caching (Vercel edge) that a targeted `revalidateTag` doesn't always reach; a full `vercel deploy --prod --yes` forces every cache layer to clear unconditionally and is the reliable fallback.

## COA / SDS files are private and gated (added with the /documents gate change)
- Files live in `private/documents/` (not `public/`), served only by `app/documents/[...path]/route.ts`. Both `middleware.ts` (matcher `/documents/:path*`, no file-extension skip for that prefix) and the route handler require the `anvil_gate` cookie.
- `next.config.mjs` `experimental.outputFileTracingIncludes` ships `private/documents/**` in the function bundle; without it the route 404s on Vercel.
- WC `documentation_file` values are normalised at read time (`normalizeDocumentUrl` in `lib/woocommerce.ts`): origin stripped so the browser requests same-origin with the gate cookie, and renamed files mapped to their coded names. COA-named files under `/wp-content/uploads/` (regex `WP_COA_FILE` in `middleware.ts`, mirrored as `WP_COA_UPLOAD` in `lib/woocommerce.ts` — keep in sync) are gated too; they are still proxied from Hostinger by the `/wp-content` rewrite once the cookie checks out. Other uploads (product/blog images) stay public. **Residual:** the same files are still directly fetchable at the Hostinger origin (`paleturquoise-crane-581984.hostingersite.com/wp-content/uploads/...`), outside this app's control — remove or protect them in WP/hPanel.
- No filename under a public path may contain a coded compound name (glp-*, retatrutide, tirzepatide, semaglutide). See `docs/coa-reissue-plan.md`.
