# /documents gate — verification report (local production-mode behaviour, not yet deployed)

Tested against `next dev` on :3001 with a locally-signed gate cookie (local GATE_SECRET). Production curls must be re-run after deploy.

| Request | Cookie | Result |
|---|---|---|
| /documents/AC300COA.pdf | none | 307 -> /gate?redirect=%2Fdocuments%2FAC300COA.pdf (with -L: 200, gate HTML, title 'Verification Required') |
| /documents/ac2t-10mg-coa.jpg | none | 307 -> /gate |
| /documents/sds/ac3r.pdf | none | 307 -> /gate |
| /documents/sds/glp-rt.pdf | none | 307 -> /gate (nothing is revealed about whether the old name exists) |
| /documents/AC300COA.pdf | forged/invalid | 307 -> /gate |
| /documents/AC300COA.pdf | valid | 200 application/pdf 291889 B, Cache-Control: private, no-store |
| /documents/ac2t-10mg-coa.jpg, ac2t-20mg-coa.pdf, ac3r-20mg-coa.pdf | valid | 200, correct types; sha1 of ac2t-10mg-coa.pdf identical to source |
| /documents/sds/ac3r.pdf, sds/ac2t.pdf | valid | 200 application/pdf |
| /documents/sds/glp-rt.pdf, /documents/glp-trz-10mg-coa.jpg (old names) | valid | 404 |
| /documents/../package.json, %2e%2e, ..%2f | valid | 404 (traversal blocked) |
| /products/glp-rt.jpg (old image name) | none | no image; Next not-found page (file no longer exists) |
| /products/ac3r.jpg, ac3r-10mg.jpg | none | 200 image/jpeg (product images stay public by design) |

Rendered /products/{ac2t,ac3r,bpc-157,ghk-cu,tb-500} (valid cookie): every /documents/ URL is relative and uses the new names; 0 occurrences of glp-rt / glp-trz in the HTML.

Build: `next build` OK; `.next/server/app/documents/[...path]/route.js.nft.json` lists 44 files under private/documents, none containing glp.

## File listing: public/
```
public/images/bannerphoto.png
public/images/bannerphoto2.png
public/images/hero-bg.jpeg
public/images/homepage/banner-b1g1.jpg
public/images/homepage/glow-hero-light.png
public/images/homepage/glow-scientist-hand.jpg
public/images/homepage/hero-vials-trio.png
public/images/homepage/hplc-instrument.jpg
public/images/homepage/scientist.jpg
public/images/homepage/shipping-info.jpg
public/images/molecule/5-amino-1mq.png
public/images/molecule/bpc-157-tb-500.png
public/images/molecule/bpc-157.png
public/images/molecule/ghk-cu.png
public/images/molecule/mots-c.png
public/images/molecule/nad-plus.png
public/images/molecule/selank.png
public/images/molecule/semax.png
public/images/molecule/tb-500.png
public/images/molecule/tesamorelin.png
public/images/payment-strip.png
public/images/productcard4-cropped.png
public/images/productcard4.png
public/products/5amino.jpg
public/products/ac2t-10mg.jpg
public/products/ac2t-20mg.jpg
public/products/ac2t.png
public/products/ac3r-10mg.jpg
public/products/ac3r-20mg.jpg
public/products/ac3r.jpg
public/products/bacwater.jpg
public/products/bpc157.jpg
public/products/cjcipa.jpg
public/products/cognitive-bundle.jpg
public/products/energy-bundle.jpg
public/products/full-bundle.jpg
public/products/ghk50.jpg
public/products/ghkcu.jpg
public/products/ghrh-bundle.jpg
public/products/glow.jpg
public/products/klow.jpg
public/products/metabolic-bundle.jpg
public/products/motsc.jpg
public/products/nad.jpg
public/products/selank.jpg
public/products/semax.jpg
public/products/tb500.jpg
public/products/tesa.jpg
public/products/wolverine.jpg
public/videos/anvil-semax-selank-loop.mp4
```

## File listing: private/documents/
```
private/documents/5-amino-1mq-coa.pdf
private/documents/AC300COA.pdf
private/documents/ac2t-10mg-coa.jpg
private/documents/ac2t-10mg-coa.pdf
private/documents/ac2t-20mg-coa.jpg
private/documents/ac2t-20mg-coa.pdf
private/documents/ac3r-20mg-coa.jpg
private/documents/ac3r-20mg-coa.pdf
private/documents/cjc-1295-ipamorelin-coa.jpg
private/documents/cjc-1295-ipamorelin-coa.pdf
private/documents/cognitive-bundle-coa.pdf
private/documents/energy-bundle-coa.pdf
private/documents/full-bundle-coa.pdf
private/documents/ghk-cu-coa.pdf
private/documents/ghrh-bundle-coa.pdf
private/documents/glow-coa.jpg
private/documents/glow-coa.pdf
private/documents/metabolic-bundle-coa.pdf
private/documents/mots-c-coa.jpg
private/documents/mots-c-coa.pdf
private/documents/nad-plus-coa.jpg
private/documents/nad-plus-coa.pdf
private/documents/sds/5-amino-1mq.pdf
private/documents/sds/ac2t.pdf
private/documents/sds/ac3r.pdf
private/documents/sds/bpc-157-tb-500.pdf
private/documents/sds/bpc-157.pdf
private/documents/sds/cjc-1295-ipamorelin.pdf
private/documents/sds/ghk-cu.pdf
private/documents/sds/glow.pdf
private/documents/sds/klow.pdf
private/documents/sds/mots-c.pdf
private/documents/sds/nad-plus.pdf
private/documents/sds/selank.pdf
private/documents/sds/semax.pdf
private/documents/sds/tb-500.pdf
private/documents/sds/tesamorelin.pdf
private/documents/selank-coa.jpg
private/documents/selank-coa.pdf
private/documents/semax-coa.jpg
private/documents/semax-coa.pdf
private/documents/tesamorelin-coa.jpg
private/documents/tesamorelin-coa.pdf
private/documents/wolverine-coa.pdf
```

## Scan
No filename or directory under public/ or private/ contains glp, retatrutide, tirzepatide, semaglutide, trz, or the old rt codes. (Names of uncoded products — bpc157, tb500, semax, tesamorelin, etc. — remain by design; see report.)

## Addendum — WP-uploaded COAs (`/wp-content/uploads/*COA*`)
Local dev, same method. TB500COA.pdf, ghkCOA.pdf, bpcCOA.pdf, klowCOA.pdf: no cookie -> 307 to /gate?redirect=...; valid cookie -> 200 application/pdf (proxied from Hostinger, %PDF header confirmed). Ordinary uploads (e.g. ac3r10-scaled-2.png) stay public (200). /library still 200. Rendered product pages emit these COAs as relative /wp-content/uploads/... paths. /documents regression: unchanged.
