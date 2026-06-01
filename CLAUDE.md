# Anvil Compounds — Project Handoff

## What This Is
A Next.js 14 website for **Anvil Compounds** (anvilcompounds.shop) — a research peptide vendor based in Southern California. The original site was rebuilt from scratch with a premium blue/white modern design. This is a **static frontend only** — no backend is connected yet.

## Current State
- ✅ Full website built and working
- ✅ All sections complete (Navbar, Hero, Products, Testing, Trust, Footer)
- ✅ Framer Motion animations throughout
- ✅ Mobile responsive
- ❌ WooCommerce NOT yet connected — products are hardcoded
- ❌ No checkout/cart functionality yet
- ❌ No deployment yet (was running locally on localhost:3000)

## The Main Task Left: WooCommerce Integration

The client (Ken) wants this Next.js site connected to a **WordPress + WooCommerce backend** (headless). Here's exactly what needs to happen:

### Step 1 — Client sets up WordPress hosting
Ken needs to:
1. Get a WordPress hosting account (SiteGround / WP Engine / Kinsta — ~$20-40/mo)
2. Install WordPress + WooCommerce plugin (one-click on most hosts)
3. Add products in WooCommerce admin
4. Generate WooCommerce REST API keys (WooCommerce → Settings → Advanced → REST API)

### Step 2 — What YOU need to build
Wire up the Next.js frontend to WooCommerce REST API:

**Products page** (`components/ProductsSection.tsx`)
- Currently products are hardcoded in the `products` array at the top of the file
- Replace with a fetch from: `GET /wp-json/wc/v3/products`
- The card component `ProductCard` is already built — just feed it live data

**Cart functionality**
- Add cart state (Zustand or React Context)
- "Inquire" buttons on product cards → "Add to Cart"
- Cart drawer/sidebar component (doesn't exist yet)

**Checkout**
- Two options: redirect to WooCommerce hosted checkout, OR build a custom checkout page
- Easiest: use WooCommerce's built-in checkout by creating a cart via API then redirecting

**Environment variables needed** (create a `.env.local` file):
```
NEXT_PUBLIC_WC_URL=https://your-wordpress-site.com
WC_CONSUMER_KEY=ck_xxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxx
```

**WooCommerce API helper** (create `lib/woocommerce.ts`):
```typescript
const WC_URL = process.env.NEXT_PUBLIC_WC_URL;
const KEY = process.env.WC_CONSUMER_KEY;
const SECRET = process.env.WC_CONSUMER_SECRET;

export async function getProducts() {
  const res = await fetch(
    `${WC_URL}/wp-json/wc/v3/products?consumer_key=${KEY}&consumer_secret=${SECRET}`
  );
  return res.json();
}
```

## Tech Stack
- **Framework**: Next.js 14.2.5 (App Router)
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 11
- **Language**: TypeScript
- **Fonts**: Syne (display), DM Sans (body), DM Mono (mono) — all from Google Fonts via next/font
- **Node**: v25.9.0 (confirmed working)

## Project Structure
```
anvilcompounds/
├── app/
│   ├── globals.css        # All custom CSS, CSS variables, utility classes
│   ├── layout.tsx         # Font setup, metadata
│   └── page.tsx           # Root page — just imports and stacks all sections
├── components/
│   ├── Navbar.tsx          # Sticky nav, scroll effect, mobile menu
│   ├── HeroSection.tsx     # Full-screen hero, particles, parallax, stats
│   ├── MarqueeBar.tsx      # Scrolling ticker between hero and products
│   ├── ProductsSection.tsx # 6-product grid with glassmorphism cards ← WIRE THIS UP
│   ├── HowWeTestSection.tsx # HPLC / Mass Spec / Endotoxin rows
│   ├── TrustSection.tsx    # Stats countup, trust pillars, shipping callout
│   └── Footer.tsx          # Links, disclaimer, contact
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Design System
| Token | Value |
|---|---|
| Navy 950 (darkest bg) | `#04091A` |
| Navy 900 (section bg) | `#0A1628` |
| Navy 800 (card bg) | `#0D1F3C` |
| Blue 600 (primary accent) | `#1D6ADB` |
| Blue 400 (light accent) | `#4D94F0` |
| Ice (light section bg) | `#EEF4FF` |
| Display font | Syne (font-display class) |
| Body font | DM Sans (font-body class) |
| Mono font | DM Mono (font-mono class) |

## Running Locally
```bash
npm install
npm run dev
# → http://localhost:3000
```

## Business Context
- **Business**: Anvil Compounds — research peptide vendor
- **Location**: Southern California
- **Products**: BPC-157, Semaglutide, Tirzepatide, KGLOW, GHK-Cu, Retatrutide
- **Tagline**: "Purity proven. Not promised."
- **USP**: Triple-method independent testing (HPLC + Mass Spec + Endotoxin)
- **Legal**: All products are "for in vitro research use only" — 21+ only
- **Contact**: support@anvilcompounds.shop
- **Shipping**: Same-day if ordered before 12PM PST, USPS Priority, 2-3 days domestic

## Deployment (when ready)
Deploy to Vercel:
1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Add environment variables in Vercel project settings
4. Deploy

## Client Notes
- Ken (the client) is non-technical — uses GitHub Desktop, no terminal access
- He communicates through Claude Code (VSCode extension)
- Keep responses concise, avoid jargon
- He wants WooCommerce specifically (not Shopify)
