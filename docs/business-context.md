# Business Context

Research peptide vendor, Southern California. Products framed strictly as **research compounds, "for in vitro/laboratory research use only," 21+** — every checkout flow includes RUO consent (`ruoConfirmed` recorded as order meta with timestamp + IP).

- USP is independent triple-method testing: HPLC + Mass Spectrometry + Endotoxin screening.
- Same-day shipping if ordered before 12PM PST; USPS Priority, 2–3 days domestic.
- Support: support@anvilcompounds.shop.
- Catalog and pricing change relatively often (see `image-manifest.md` for SKUs currently blocked from publishing on missing images/COA) — always check `lib/woocommerce.ts` and the live WC admin rather than assuming the product list in this repo's docs is exhaustive.

Sibling project: **Legend Research** (`../legendresearch`, legendresearch.info) — separate legal entity, domain, WordPress install, hosting, Vercel project, and git history. Connection is intentional hyperlinks only (no shared code/credentials/sessions). Legend Research's registry pages pull supplemental mechanism/evidence content transcribed from this project's SDS PDFs (`public/documents/sds/*.pdf`) and live pricing/COA data via this project's WooCommerce REST API — see `../legendresearch/docs/architecture.md` for how that's consumed on their end. Nothing in this repo needs to know about that consumption; it's read-only from their side.

## Working Notes

- The client (Ken) is non-technical (GitHub Desktop only, no terminal) and communicates through Claude Code — keep explanations concise and non-jargon-heavy when the audience is Ken rather than another engineer.
- `.claude/settings.local.json` is gitignored on purpose (it has held local credentials in the past — see commit `c2ce5e6`). Don't add secrets to any tracked file.
- Branches in this repo tend to be short-lived feature branches per fix (e.g. `diagnose-orders`, `crypto-checkout`, `on-hold-status`) merged into `main`.
