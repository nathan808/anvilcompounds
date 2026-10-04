# COA re-issue plan — coded product names

**Status:** plan only. No COA PDF or JPG has been edited, and none should be.

## Why
The third-party lab COAs for AC3R and AC2T name the underlying compound inside the document text. Those documents are the lab's record; editing them would compromise their integrity, so the fix is to have the lab re-issue them, not to modify the files.

| File (private/documents/) | Lot | Text that names the compound |
|---|---|---|
| `AC300COA.pdf` (AC3R 10mg) | AC-RT-1 | "Product: Retatrutide 10mg"; identity row "GLP RT" |
| `ac3r-20mg-coa.pdf` / `.jpg` | — | "Retatrutide", "GLP RT" |
| `ac2t-10mg-coa.pdf` / `.jpg` | AC-TZ-1 | "Product: Tirzepatide 10mg"; identity row "GLP TZ" |
| `ac2t-20mg-coa.pdf` / `.jpg` | — | "Tirzepatide", "GLP TZ" |
| `full-bundle-coa.pdf`, `ghrh-bundle-coa.pdf`, `metabolic-bundle-coa.pdf` | — | "Retatrutide", "GLP RT" (bundle products are trashed in WC; retire these files with them) |

## Interim controls (done in this change)
- Files moved out of `public/` to `private/documents/`; served only by `app/documents/[...path]/route.ts`, which requires the gate cookie.
- `middleware.ts` matcher includes `/documents/:path*` and no longer skips file extensions there.
- Filenames carry the house code (`ac3r-*`, `ac2t-*`); WC meta is normalised at read time by `normalizeDocumentUrl` in `lib/woocommerce.ts`.

## Plan, at the next lot refresh
1. **Ask the lab (Freedom Diagnostics) in the sample submission**: label the sample and the COA "Product" field with the house code (`AC3R 10mg`, `AC2T 10mg`). Put the code on the vial label/sample ID we send, since the lab prints what it receives.
2. **Identity row**: ask whether the lab will print the identity result as "Identity: Confirmed" without naming the compound. If the lab can't, the in-document compound name stays; keep those COAs gated only.
3. **Lot IDs**: move from `AC-RT-1` / `AC-TZ-1` to codes with no compound abbreviation (e.g. `AC3R-<yyyymm>-1`, `AC2T-<yyyymm>-1`).
4. **On receipt**: file as `ac3r-<size>-coa.pdf` / `ac2t-<size>-coa.pdf` in `private/documents/`, keep the old file under `private/documents/archive/` (not served: the route only reads names matching the safe-segment rule and nothing links to the archive), update `RENAMED_DOCUMENTS` only if a URL changes, and update WC `documentation_file` on each variation (parent AND variations — variation meta overrides the parent).
5. **WC writes** use a relative path (`/documents/ac3r-10mg-coa.pdf`), never the `anvilcompounds.shop` domain string (Hostinger rewrites it). Re-fetch each product after writing and confirm the stored value.
6. **Retire** the old-name files and the bundle COAs once nothing references them. Keep the lab's original reports in the records archive, outside the repo.
7. **Re-run the audit**: extract text from every PDF in `private/documents/` and confirm none of the terms retatrutide / tirzepatide / semaglutide / GLP-1 / "GLP RT" / "GLP TZ" appear.

## Open dependency
`legendresearch/lib/anvilSourcing.ts` links directly to `https://www.anvilcompounds.shop/documents/...` COA URLs. Visitors now pass through the gate first; the AC2T entry must change from `glp-trz-10mg-coa.jpg` to `ac2t-10mg-coa.jpg`.
