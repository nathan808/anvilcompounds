import { displayCategory } from "@/lib/catalogLabels";
import type { ProductPageData } from "@/components/ProductPageTemplate";

// ─── Product page data fetching ────────────────────────────────────────────────

const SLUG_TO_WC_ID: Record<string, number> = {
  "bpc-157":    332,
  "ac2t":       333,
  "ac3r":       337,
  "klow":       335,
  "ghk-cu":     336,
  "tb-500":     354,
  "mots-c":     346,
  "bac-water":  349,
  // New SKUs — Testing in Progress (no COA yet)
  "nad-plus":              443,
  "tesamorelin":           445,
  "cjc-1295-ipamorelin":   446,
  "5-amino-1mq":           450,
  "bpc-157-tb-500":        447,
  "glow":                  449,
  "semax":                 510,
  "selank":                511,
};

// COA/SDS files live in private/documents/ (not public/) and are served by
// app/documents/[...path]/route.ts behind the gate cookie. WC's
// `documentation_file` meta still holds absolute URLs on the vercel.app host
// (the apex host can't be stored — see the Hostinger rewrite gotcha) and, for
// AC2T/AC3R, the pre-rename glp-* filenames. Normalise both at read time:
// strip the origin so the browser requests the file same-origin (with the
// gate cookie), and map renamed files to their coded names. COA-named files under
// /wp-content/uploads are made relative the same way; anything else passes
// through untouched.
const RENAMED_DOCUMENTS: Record<string, string> = {
  "glp-rt-20mg-coa.jpg":  "ac3r-20mg-coa.jpg",
  "glp-rt-20mg-coa.pdf":  "ac3r-20mg-coa.pdf",
  "glp-trz-10mg-coa.jpg": "ac2t-10mg-coa.jpg",
  "glp-trz-10mg-coa.pdf": "ac2t-10mg-coa.pdf",
  "glp-trz-20mg-coa.jpg": "ac2t-20mg-coa.jpg",
  "glp-trz-20mg-coa.pdf": "ac2t-20mg-coa.pdf",
  "sds/glp-rt.pdf":       "sds/ac3r.pdf",
  "sds/glp-trz.pdf":      "sds/ac2t.pdf",
};

const WP_COA_UPLOAD = /^\/wp-content\/uploads\/.*coa(?:[^a-z0-9][^/]*)?\.(?:pdf|jpe?g|png)$/i; // keep in sync with middleware.ts WP_COA_FILE

export function normalizeDocumentUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let pathname: string;
  try {
    pathname = new URL(url, "https://www.anvilcompounds.shop").pathname;
  } catch {
    return url;
  }
  // WP-uploaded COAs: keep the path (the /wp-content rewrite proxies it) but
  // drop the origin so the browser requests it from www with the gate cookie.
  if (WP_COA_UPLOAD.test(pathname)) return pathname;
  if (!pathname.startsWith("/documents/")) return url;
  const rest = pathname.slice("/documents/".length);
  return `/documents/${RENAMED_DOCUMENTS[rest] ?? rest}`;
}

// Safety Data Sheets — files under private/documents/sds/, keyed by
// slug rather than pulled from WC meta. No entry for a slug means no source
// PDF exists yet (falls back to the "included with every order" notice in
// SdsPreviewButton) — currently true only for bac-water.
const SLUG_TO_SDS: Record<string, string> = {
  "bpc-157":              "/documents/sds/bpc-157.pdf",
  "ac2t":                 "/documents/sds/ac2t.pdf",
  "ac3r":                 "/documents/sds/ac3r.pdf",
  "klow":                 "/documents/sds/klow.pdf",
  "ghk-cu":               "/documents/sds/ghk-cu.pdf",
  "tb-500":               "/documents/sds/tb-500.pdf",
  "mots-c":               "/documents/sds/mots-c.pdf",
  "nad-plus":             "/documents/sds/nad-plus.pdf",
  "tesamorelin":          "/documents/sds/tesamorelin.pdf",
  "cjc-1295-ipamorelin":  "/documents/sds/cjc-1295-ipamorelin.pdf",
  "5-amino-1mq":          "/documents/sds/5-amino-1mq.pdf",
  "bpc-157-tb-500":       "/documents/sds/bpc-157-tb-500.pdf",
  "glow":                 "/documents/sds/glow.pdf",
  "semax":                "/documents/sds/semax.pdf",
  "selank":               "/documents/sds/selank.pdf",
};

// Molecular structure / sequence diagrams cropped from each compound's SDS
// reference document, for use as a supporting visual alongside the written
// composition copy. Not every SDS includes one (GLP compounds carry a
// regulatory-distinction notice instead of a diagram; blends carry a
// constituent table) — those slugs are simply omitted here.
const SLUG_TO_MOLECULE_IMAGE: Record<string, string> = {
  "bpc-157":              "/images/molecule/bpc-157.png",
  "ghk-cu":               "/images/molecule/ghk-cu.png",
  "tb-500":               "/images/molecule/tb-500.png",
  "mots-c":               "/images/molecule/mots-c.png",
  "nad-plus":             "/images/molecule/nad-plus.png",
  "tesamorelin":          "/images/molecule/tesamorelin.png",
  "5-amino-1mq":          "/images/molecule/5-amino-1mq.png",
  "bpc-157-tb-500":       "/images/molecule/bpc-157-tb-500.png",
  "semax":                "/images/molecule/semax.png",
  "selank":               "/images/molecule/selank.png",
};

const SLUG_TO_NAME: Record<string, string> = {
  "bpc-157":    "BPC-157",
  "ac2t":       "AC2T",
  "ac3r":       "AC3R",
  "klow":       "KLOW",
  "ghk-cu":     "GHK-Cu",
  "tb-500":     "TB-500",
  "mots-c":     "MOTS-c",
  "bac-water":  "Bacteriostatic Water",
  "nad-plus":              "NAD+",
  "tesamorelin":           "Tesamorelin",
  "cjc-1295-ipamorelin":   "CJC-1295 + Ipamorelin",
  "5-amino-1mq":           "5-Amino-1MQ",
  "bpc-157-tb-500":        "BPC-157 + TB-500",
  "glow":                  "GLOW",
  "semax":                 "Semax",
  "selank":                "Selank",
};

const RELATED_MAP: Record<string, string[]> = {
  "bpc-157":    ["tb-500", "bpc-157-tb-500", "glow"],
  "ac2t":       ["ac3r", "mots-c", "5-amino-1mq"],
  "ac3r":       ["ac2t", "mots-c", "nad-plus"],
  "klow":       ["glow", "ghk-cu", "bpc-157"],
  "ghk-cu":     ["glow", "klow", "bpc-157"],
  "tb-500":     ["bpc-157", "bpc-157-tb-500", "glow"],
  "mots-c":     ["nad-plus", "5-amino-1mq", "ac3r"],
  "bac-water":  ["bpc-157", "tb-500", "ghk-cu"],
  "nad-plus":            ["5-amino-1mq", "mots-c", "tesamorelin"],
  "tesamorelin":         ["cjc-1295-ipamorelin", "nad-plus", "mots-c"],
  "cjc-1295-ipamorelin": ["tesamorelin", "nad-plus", "mots-c"],
  "5-amino-1mq":         ["nad-plus", "mots-c", "ac2t"],
  "bpc-157-tb-500":      ["bpc-157", "tb-500", "glow"],
  "glow":                ["klow", "ghk-cu", "bpc-157-tb-500"],
  "semax":               ["selank", "bpc-157", "mots-c"],
  "selank":              ["semax", "bpc-157", "ghk-cu"],
};

const FALLBACK_TRUST_BADGES = ["99%+ purity", "Endotoxin screened", "COA verified", "Same-day shipping"];

interface WCProductFull {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: string;
  price: string;
  regular_price: string;
  description: string;
  short_description: string;
  categories: { id: number; name: string; slug: string }[];
  images: { src: string; alt: string }[];
  meta_data: { id: number; key: string; value: string }[];
  attributes: { name: string; options: string[] }[];
  manage_stock: boolean;
  stock_quantity: number | null;
}

interface WCVariation {
  id: number;
  price: string;
  regular_price: string;
  attributes: { id: number; name: string; option: string }[];
  image?: { src: string } | null;
  meta_data?: { id: number; key: string; value: string }[];
  manage_stock: boolean;
  stock_quantity: number | null;
}

function buildMetaMap(metaData: { key: string; value: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const m of metaData) {
    if (!m.key.startsWith("_")) map[m.key] = m.value;
  }
  return map;
}

function parseRepeater(
  meta: Record<string, string>,
  fieldName: string,
  subFields: string[]
): Record<string, string>[] {
  const count = parseInt(meta[fieldName] ?? "0", 10);
  if (!count) return [];
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, string> = {};
    for (const sub of subFields) {
      row[sub] = meta[`${fieldName}_${i}_${sub}`] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

export async function getProductPageData(slug: string): Promise<ProductPageData | null> {
  const wcId = SLUG_TO_WC_ID[slug];
  if (!wcId) return null;

  const url    = process.env.WC_URL;
  const key    = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) return null;

  const auth = `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
  const headers = { Authorization: auth };
  // Same 60s window + tag as getProducts (catalog grid), so product pages
  // render from cache instead of waiting ~1s on WC every visit. Stale prices
  // can't be charged: place-order re-reads every price live (lib/wcProducts.ts)
  // and returns CART_CHANGED on a mismatch. Bust early after a WC price edit
  // via /api/revalidate (tag "wc-products").
  const opts = { next: { revalidate: 60, tags: ["wc-products"] } };

  try {
    const [productRes, variationsRes] = await Promise.all([
      fetch(`${url}/wp-json/wc/v3/products/${wcId}`, { headers, ...opts }),
      fetch(`${url}/wp-json/wc/v3/products/${wcId}/variations?per_page=20`, { headers, ...opts }),
    ]);

    if (!productRes.ok) return null;

    const product: WCProductFull = await productRes.json();
    const variations: WCVariation[] = variationsRes.ok ? await variationsRes.json() : [];

    const meta = buildMetaMap(product.meta_data);

    const sortedVars = [...variations].sort(
      (a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0")
    );
    let sizes = sortedVars
      .map((v) => v.attributes.find((a) => a.name === "Size")?.option ?? "")
      .filter(Boolean);
    let sizesPrices = sortedVars.map(
      (v) => parseFloat(v.price || v.regular_price || product.price || "0")
    );
    // Per-size "was" price for the launch sale (regular_price above the
    // active price) — null for anything not currently on sale.
    let sizesOriginalPrices: (number | null)[] = sortedVars.map((v) => {
      const active = parseFloat(v.price || v.regular_price || product.price || "0");
      const regular = parseFloat(v.regular_price || "0");
      return regular > active ? regular : null;
    });
    // Per-size photo + COA — read off each WC variation's own `image` and
    // `documentation_file` meta (set via the variations API, same as any
    // other per-variation field). Null here just means "this variation
    // doesn't have its own" — resolved against the product-level fallback
    // below, so a product can mix (e.g. one size with a dedicated photo,
    // the other still sharing the base image) without extra plumbing.
    let sizesImagesRaw: (string | null)[] = sortedVars.map((v) => v.image?.src ?? null);
    // Per-variation stock, same shape as sizesPrices — null means "not
    // tracking stock for this size" (manage_stock off), which the UI treats
    // as "don't show a low-stock badge" rather than assuming it's in stock.
    let sizesStockRaw: (number | null)[] = sortedVars.map((v) =>
      v.manage_stock ? v.stock_quantity : null
    );
    let sizesDocFilesRaw: (string | null)[] = sortedVars.map((v) => {
      const vMeta = buildMetaMap(v.meta_data ?? []);
      return normalizeDocumentUrl(vMeta["documentation_file"]);
    });

    // Simple (non-variable) products have no /variations rows, but may still
    // carry a fixed, non-variation "Size" attribute directly on the base
    // product (e.g. KLOW's 80mg blend) — fall back to that so the mg pill
    // and Reconstitution Guide still have something to read.
    if (sizes.length === 0) {
      const baseSizeAttr = product.attributes?.find(
        (a) => a.name.toLowerCase() === "size"
      );
      if (baseSizeAttr?.options.length) {
        sizes = baseSizeAttr.options;
        const basePriceForFallback = parseFloat(product.price || product.regular_price || "0");
        sizesPrices = baseSizeAttr.options.map(() => basePriceForFallback);
        const regularForFallback = parseFloat(product.regular_price || "0");
        const originalForFallback = regularForFallback > basePriceForFallback ? regularForFallback : null;
        sizesOriginalPrices = baseSizeAttr.options.map(() => originalForFallback);
        sizesImagesRaw = baseSizeAttr.options.map(() => null);
        sizesDocFilesRaw = baseSizeAttr.options.map(() => null);
        const stockForFallback = product.manage_stock ? product.stock_quantity : null;
        sizesStockRaw = baseSizeAttr.options.map(() => stockForFallback);
      }
    }

    const trustBadgesRaw = parseRepeater(meta, "trust_badges", ["badge"])
      .map((r) => r.badge)
      .filter(Boolean);
    const trustBadges = trustBadgesRaw.length === 4 ? trustBadgesRaw : FALLBACK_TRUST_BADGES;

    const researchApplications = parseRepeater(meta, "research_applications", ["application"])
      .map((r) => r.application)
      .filter(Boolean);

    const documentationMetrics = parseRepeater(meta, "documentation_metrics", ["label", "value"])
      .map((r) => ({ label: r.label ?? "", value: r.value ?? "" }));
    const propertiesTable = parseRepeater(meta, "properties_table", ["label", "value"])
      .map((r) => ({ label: r.label ?? "", value: r.value ?? "" }));

    // Related Compounds reuses the exact live catalog card (image, price,
    // purity, badge, Add to Cart / View COA), so it's built from the same
    // getProducts() data the /catalog page and homepage teaser use, rather
    // than a bare slug/name/category lookup.
    const relatedSlugs = (RELATED_MAP[slug] ?? []).slice(0, 3);
    const catalogCards = await getProducts();
    const relatedProducts = relatedSlugs
      .map((s) => {
        const name = SLUG_TO_NAME[s];
        return catalogCards.find((c) => c.name === name);
      })
      .filter((c): c is ProductCard => c !== undefined);

    const basePrice = parseFloat(product.price || product.regular_price || "0");
    const regularBasePrice = parseFloat(product.regular_price || "0");
    const originalBasePrice = regularBasePrice > basePrice ? regularBasePrice : null;

    const fallbackImage = LOCAL_PRODUCT_IMAGES[product.name] ?? product.images[0]?.src ?? null;
    const fallbackDocFile = normalizeDocumentUrl(meta["documentation_file"]);
    const sizesImages = (sizes.length ? sizesImagesRaw : [null]).map((img) => img ?? fallbackImage);
    const sizesDocumentationFiles = (sizes.length ? sizesDocFilesRaw : [null]).map((f) => f ?? fallbackDocFile);
    const fallbackStock = product.manage_stock ? product.stock_quantity : null;
    const sizesStock = (sizes.length ? sizesStockRaw : [fallbackStock]).map((s) => s ?? fallbackStock);

    return {
      slug,
      name:        product.name,
      category:    displayCategory(stripHtml(product.categories[0]?.name ?? "Research Compounds")),
      subtitle:    meta["subtitle"] ?? "",
      price:       `$${basePrice.toFixed(2)}`,
      priceNumber: sizesPrices[0] ?? basePrice,
      priceUnit:   "/ vial",
      sizes:       sizes.length ? sizes : ["Standard"],
      sizesPrices: sizesPrices.length ? sizesPrices : [basePrice],
      sizesOriginalPrices: sizesOriginalPrices.length ? sizesOriginalPrices : [originalBasePrice],
      sizesImages,
      sizesDocumentationFiles,
      sizesStock,
      wcProductId: product.id,
      image:       fallbackImage,
      trustBadges,
      whatItIsSubtitle:    meta["what_it_is_subtitle"]         ?? `${product.name} | Research Use Only`,
      whatItIsBody:        meta["what_it_is_body"]             ?? "",
      compositionBody:     meta["composition_body"]            || undefined,
      researchApplications,
      documentationHeading: meta["documentation_section_heading"] ?? "Documentation & Quality",
      documentationMetrics,
      documentationFile:    normalizeDocumentUrl(meta["documentation_file"]),
      documentationImage:   meta["documentation_image"]         ?? null,
      hasCoa:               !IDS_WITHOUT_COA.has(wcId),
      coaApplicable:        !NO_COA_REQUIRED_IDS.has(wcId),
      sdsFile:              SLUG_TO_SDS[slug]                   ?? null,
      moleculeImage:        SLUG_TO_MOLECULE_IMAGE[slug]        ?? null,
      documentationCaption: meta["documentation_caption"]       ?? "",
      propertiesTable,
      catalogCode:          product.sku || null,
      purity:               meta["hplc_purity"] || null,
      lotId:                meta["current_lot_id"] || null,
      shippingType: (meta["shipping_type"] as "standard" | "ambient") ?? "standard",
      relatedProducts,
    };
  } catch {
    return null;
  }
}

// ─── Catalog card helpers (existing) ──────────────────────────────────────────

const ICONS = ["⬡", "◈", "◇", "✦", "⬢", "⬟"];

const DEFAULT_BADGE = { label: "Verified", color: "bg-slate-600/70 text-slate-100 border-slate-500/50" };

// Per-product badge — keyed on every name variant WooCommerce has used for
// that product (see PRODUCT_PAGE_URLS / LOCAL_PRODUCT_IMAGES above for the
// same variant lists). Falls back to DEFAULT_BADGE for any product not
// listed here (e.g. a brand-new SKU) rather than cycling through an
// unrelated rotation — a product's badge should never depend on its
// position in the WooCommerce response.
const PRODUCT_BADGES: Record<string, { label: string; color: string }> = {
  "BPC-157":                                      { label: "Synthetic Peptide",       color: "bg-slate-100 text-slate-700 border-slate-300" },
  "BPC-157 + TB-500":                              { label: "Peptide Blend",   color: "bg-slate-100 text-slate-700 border-slate-300" },
  "TB-500":                                       { label: "Synthetic Peptide",   color: "bg-slate-100 text-slate-700 border-slate-300" },
  "KLOW":                                         { label: "Peptide Blend",     color: "bg-slate-100 text-slate-700 border-slate-300" },
  "GLOW":                                         { label: "Peptide Blend",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "GHK-Cu":                                       { label: "Copper Peptide",       color: "bg-slate-100 text-slate-700 border-slate-300" },
  "T1rz":                                         { label: "Dual Agonist",      color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Trz- dual receptor":                           { label: "Dual Agonist",      color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Dual Receptor (T)":                            { label: "Dual Agonist",      color: "bg-slate-100 text-slate-700 border-slate-300" },
  "GLP-TRZ":                                      { label: "Dual Agonist",      color: "bg-slate-100 text-slate-700 border-slate-300" },
  "AC2T":                                         { label: "Dual Agonist",      color: "bg-slate-100 text-slate-700 border-slate-300" },
  "R3ta":                                         { label: "Triple Agonist",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Rta - triple agonist":                         { label: "Triple Agonist",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "triple agonist (R)":                           { label: "Triple Agonist",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Triple Agonist (R)":                           { label: "Triple Agonist",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "GLP-RT":                                       { label: "Triple Agonist",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "AC3R":                                         { label: "Triple Agonist",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "MOTS-c":                                       { label: "Mitochondrial Peptide",         color: "bg-slate-100 text-slate-700 border-slate-300" },
  "NAD+":                                         { label: "Coenzyme",   color: "bg-slate-100 text-slate-700 border-slate-300" },
  "CJC-1295 + Ipamorelin":                        { label: "Peptide Blend",          color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Tesamorelin":                                  { label: "GHRH Analogue",     color: "bg-slate-100 text-slate-700 border-slate-300" },
  "5-Amino-1MQ":                                  { label: "Small Molecule", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Semax":                                        { label: "Peptide Analogue",    color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Selank":                                       { label: "Peptide Analogue", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Bacteriostatic Water":                         { label: "Laboratory Supply",  color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Reconstitution Solution – for Laboratory Use": { label: "Laboratory Supply",  color: "bg-slate-100 text-slate-700 border-slate-300" },
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function getAttribute(product: WCProduct, name: string): string | undefined {
  const attr = product.attributes.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );
  return attr?.options[0];
}

// Full options list (not just the first) — used for the "Size" attribute,
// which for variable products (e.g. GHK-Cu's 50mg/100mg) already comes back
// on the base product list response, so the catalog card can show every mg
// option without an extra per-product /variations fetch.
function getAttributeOptions(product: WCProduct, name: string): string[] {
  const attr = product.attributes.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );
  return attr?.options ?? [];
}

export interface WCProduct {
  id: number;
  name: string;
  sku?: string;
  type: string;
  short_description: string;
  price: string;
  regular_price: string;
  on_sale: boolean;
  permalink: string;
  categories: Array<{ name: string }>;
  attributes: Array<{ name: string; options: string[] }>;
  images: Array<{ src: string; alt: string }>;
  meta_data: Array<{ key: string; value: string }>;
  manage_stock: boolean;
  stock_quantity: number | null;
}

export interface ProductCard {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  originalPrice?: string;
  purity: string;
  badge: string;
  badgeColor: string;
  icon: string;
  permalink: string;
  image: string | null;
  hasCoa: boolean;
  // false only for supply/accessory items that will never have a lab COA
  // (see NO_COA_REQUIRED_IDS) — hides the "View COA" button entirely rather
  // than opening a modal with nothing in it.
  coaApplicable: boolean;
  sku?: string | null;
  sizes: string[];
  // Lets the catalog card open the COA directly (see ProductsSection.tsx)
  // instead of routing to /coas. Product-level only — the card doesn't
  // carry per-size COA switching, that lives on the product page/COA library.
  documentationFile: string | null;
  documentationImage: string | null;
  // Product-level manage_stock/stock_quantity only — null/undefined
  // whenever stock isn't tracked at the product level (e.g. variable
  // products, which WC only tracks per-variation). The catalog card has no size
  // selector, so there's no cheap way to resolve a variable product's
  // per-variation number here without an extra /variations fetch per card;
  // the product detail page (sizesStock in ProductPageData) is where
  // that's accurate.
  stockQuantity?: number | null;
  // The size string the catalog card's one-click add puts in the cart —
  // must be exactly what the product page's default selection
  // (ProductPageData.sizes[0]) would put there, so adding the same product
  // from both places merges into one cart line (cartContext matches on
  // slug + size). A mismatch ("Standard" vs "10mg") split one SKU into two
  // lines, each earning its own B1G1 pair — order #1276, 2026-09-23.
  defaultSize?: string;
}

// Products without COA yet (Testing in Progress — no buy UI shown).
// Empty as of the Aug 2026 COA batch — every SKU now has documentation_file
// set (directly or per-size, on the WC product/variation), so nothing is
// gated. Re-add a WC product ID here if a future SKU launches ahead of its COA.
const IDS_WITHOUT_COA = new Set<number>([]);

// Supply/accessory items that will never have a lab COA (not a tested
// compound) — distinct from IDS_WITHOUT_COA, which means "COA coming soon."
// Products here get no COA button/UI at all, on the product page or catalog
// card, instead of a perpetual "COA Pending" state. Currently just the
// Reconstitution Solution (349), a plain benzyl-alcohol solvent.
const NO_COA_REQUIRED_IDS = new Set<number>([349]);

const PRODUCT_PAGE_URLS: Record<string, string> = {
  "BPC-157":                                      "https://anvilcompounds.shop/product/bpc-157/",
  "T1rz":                                         "https://anvilcompounds.shop/product/t1rz/",
  "Trz- dual receptor":                           "https://anvilcompounds.shop/product/trz/",
  "Dual Receptor (T)":                            "https://anvilcompounds.shop/product/t1rz/",
  "R3ta":                                         "https://anvilcompounds.shop/product/r3ta/",
  "Rta - triple agonist":                         "https://anvilcompounds.shop/product/rta/",
  "triple agonist (R)":                           "https://anvilcompounds.shop/product/rta/",
  "Triple Agonist (R)":                           "https://anvilcompounds.shop/product/r3ta/",
  "GLP-TRZ":                                      "https://anvilcompounds.shop/product/glp-trz/",
  "GLP-RT":                                       "https://anvilcompounds.shop/product/glp-rt/",
  "AC2T":                                         "https://anvilcompounds.shop/product/ac2t/",
  "AC3R":                                         "https://anvilcompounds.shop/product/ac3r/",
  "KLOW":                                         "https://anvilcompounds.shop/product/klow/",
  "GHK-Cu":                                       "https://anvilcompounds.shop/product/ghk-cu/",
  "TB-500":                                       "https://anvilcompounds.shop/product/tb-500/",
  "Bacteriostatic Water":                         "https://anvilcompounds.shop/product/bac-water/",
  "Reconstitution Solution – for Laboratory Use": "https://anvilcompounds.shop/product/bacteriostatic-water/",
  "MOTS-c":                                       "https://anvilcompounds.shop/product/mots-c/",
  "BPC-157 + TB-500":                              "https://anvilcompounds.shop/product/bpc-157-tb-500/",
};

// Aug 2026 photo refresh — every entry now points at the new vial+COA-card
// photography (see PRODUCT_PHOTO_ASPECT in ProductImageGallery.tsx for the
// shared aspect ratio this whole batch was shot/exported at). GLP-TRZ and
// GLP-RT default here to their 10mg shot; the actual per-size photo on the
// product page comes from each WC variation's own `image` via
// getProductPageData's sizesImages — this table is just the catalog-card /
// no-variation-match fallback.
const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  "BPC-157":                                      "/products/bpc157.jpg",
  "T1rz":                                         "/products/ac2t-10mg.jpg",
  "Trz- dual receptor":                           "/products/ac2t-10mg.jpg",
  "Dual Receptor (T)":                            "/products/ac2t-10mg.jpg",
  "R3ta":                                         "/products/ac3r-10mg.jpg",
  "Rta - triple agonist":                         "/products/ac3r-10mg.jpg",
  "triple agonist (R)":                           "/products/ac3r-10mg.jpg",
  "Triple Agonist (R)":                           "/products/ac3r-10mg.jpg",
  "GLP-TRZ":                                      "/products/ac2t-10mg.jpg",
  "GLP-RT":                                       "/products/ac3r-10mg.jpg",
  "AC2T":                                         "/products/ac2t-10mg.jpg",
  "AC3R":                                         "/products/ac3r-10mg.jpg",
  "KLOW":                                         "/products/klow.jpg",
  "GHK-Cu":                                       "/products/ghkcu.jpg",
  "TB-500":                                       "/products/tb500.jpg",
  "MOTS-c":                                       "/products/motsc.jpg",
  "BPC-157 + TB-500":                              "/products/wolverine.jpg",
  "NAD+":                                         "/products/nad.jpg",
  "Tesamorelin":                                  "/products/tesa.jpg",
  "CJC-1295 + Ipamorelin":                        "/products/cjcipa.jpg",
  "5-Amino-1MQ":                                  "/products/5amino.jpg",
  "GLOW":                                         "/products/glow.jpg",
  "Semax":                                        "/products/semax.jpg",
  "Selank":                                       "/products/selank.jpg",
  "Bacteriostatic Water":                         "/products/bacwater.jpg",
  "Reconstitution Solution – for Laboratory Use": "/products/bacwater.jpg",
};

// Real lab-verified purity, pulled from the same documentation_metrics ACF
// repeater the product page's Documentation & Quality table reads (see
// getProductPageData). Falls back through the WC "Purity" attribute (rarely
// set) to a generic "99%+" only if a product genuinely has no COA data yet.
// The catalog card's bar-fill animation uses this string directly as a CSS
// width, so a blend product's composite value (e.g. "BPC-157 99.53% ·
// TB-500 99.16%" for Wolverine, which has no single combined-batch COA)
// resolves to the lower of the two numbers rather than breaking the bar.
function extractPurity(product: WCProduct): string | undefined {
  const meta = buildMetaMap(product.meta_data ?? []);
  const rows = parseRepeater(meta, "documentation_metrics", ["label", "value"]);
  const purityRow = rows.find((r) => r.label?.trim().toLowerCase() === "purity");
  const raw = purityRow?.value?.trim();
  if (!raw || raw.toLowerCase() === "testing in progress") return undefined;

  const matches = Array.from(raw.matchAll(/(\d+(?:\.\d+)?)\s*%/g)).map((m) => parseFloat(m[1]));
  if (!matches.length) return raw; // descriptive value with no % in it — show as-is
  return `${Math.min(...matches)}%`;
}

export function mapProduct(product: WCProduct, index: number, originalPriceOverride?: string, minVariationSize?: string): ProductCard {
  const badge = PRODUCT_BADGES[product.name] ?? DEFAULT_BADGE;
  const meta = buildMetaMap(product.meta_data ?? []);
  // Variable products carry no top-level regular_price (WC only sets that
  // per-variation) — the caller resolves the min-price variation's
  // regular_price separately and passes it in as originalPriceOverride.
  const originalPriceRaw = product.on_sale
    ? (product.type === "variable" ? originalPriceOverride : product.regular_price)
    : undefined;
  const originalPrice = originalPriceRaw && parseFloat(originalPriceRaw) > parseFloat(product.price || "0")
    ? `$${originalPriceRaw}`
    : undefined;
  return {
    id:          product.id,
    name:        product.name,
    category:    displayCategory(stripHtml(product.categories[0]?.name ?? "Research Compound")),
    description: stripHtml(product.short_description) || "Research-grade compound with full COA documentation.",
    price:       product.price ? `$${product.price}` : "—",
    originalPrice,
    purity:      getAttribute(product, "Purity") ?? extractPurity(product) ?? "99%+",
    // Code-defined labels take precedence over WC's legacy "Badge" product
    // attribute (which still holds the old marketing labels); the attribute
    // only applies to products with no entry in PRODUCT_BADGES.
    badge:       PRODUCT_BADGES[product.name]?.label ?? getAttribute(product, "Badge") ?? badge.label,
    badgeColor:  badge.color,
    icon:        ICONS[index % ICONS.length],
    permalink:   PRODUCT_PAGE_URLS[product.name] ?? product.permalink,
    image:       LOCAL_PRODUCT_IMAGES[product.name] ?? product.images[0]?.src ?? null,
    hasCoa:      !IDS_WITHOUT_COA.has(product.id),
    coaApplicable: !NO_COA_REQUIRED_IDS.has(product.id),
    sku:         product.sku || null,
    sizes:       getAttributeOptions(product, "Size"),
    documentationFile:  normalizeDocumentUrl(meta["documentation_file"]),
    documentationImage: meta["documentation_image"] ?? null,
    stockQuantity: product.manage_stock ? product.stock_quantity : null,
    // Same resolution as getProductPageData's sizes[0]: the min-price
    // variation's Size for a variable product, else the base product's own
    // Size attribute, else "Standard".
    defaultSize: minVariationSize ?? getAttributeOptions(product, "Size")[0] ?? "Standard",
  };
}

// AC Research Library's downloadable guide products live in this same
// WooCommerce store (so its own checkout/downloads work) but must never
// appear in Anvil's own catalog -- exclude by their shared name pattern
// rather than by category, since they're deliberately left Uncategorized.
const LIBRARY_GUIDE_NAME_PATTERN = /Laboratory Research Guide/i;

// Only the fields mapProduct/getProducts read — roughly halves the WC payload.
const LIST_FIELDS = "id,name,sku,type,short_description,price,regular_price,on_sale,permalink,categories,attributes,images,meta_data,manage_stock,stock_quantity";

export async function getProducts(): Promise<ProductCard[]> {
  const url    = process.env.WC_URL;
  const key    = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  const res = await fetch(
    `${url}/wp-json/wc/v3/products?consumer_key=${key}&consumer_secret=${secret}&status=publish&per_page=100&_fields=${LIST_FIELDS}`,
    { next: { revalidate: 60, tags: ["wc-products"] } }
  );

  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);

  const products: WCProduct[] = await res.json();
  const filtered = products.filter((p) => !LIBRARY_GUIDE_NAME_PATTERN.test(p.name));

  // Variable products don't carry a top-level regular_price (WC only sets
  // that per-variation), so fetch their variations to find the min-price
  // one's regular_price — that's the "was" price shown crossed out next to
  // the catalog card's "From $X" (on-sale products only) — and its Size,
  // the card's defaultSize for one-click add (every variable product).
  const variableProducts = filtered.filter((p) => p.type === "variable");
  const originalPriceOverrides = new Map<number, string>();
  const minVariationSizes = new Map<number, string>();
  if (variableProducts.length) {
    await Promise.all(
      variableProducts.map(async (p) => {
        const varRes = await fetch(
          `${url}/wp-json/wc/v3/products/${p.id}/variations?consumer_key=${key}&consumer_secret=${secret}&per_page=50&_fields=price,regular_price,attributes`,
          { next: { revalidate: 60, tags: ["wc-products"] } }
        );
        if (!varRes.ok) return;
        const variations: { price: string; regular_price: string; attributes: { name: string; option: string }[] }[] = await varRes.json();
        const minVar = [...variations].sort(
          (a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0")
        )[0];
        if (p.on_sale && minVar?.regular_price) originalPriceOverrides.set(p.id, minVar.regular_price);
        const minSize = minVar?.attributes.find((a) => a.name === "Size")?.option;
        if (minSize) minVariationSizes.set(p.id, minSize);
      })
    );
  }

  return filtered.map((p, i) => mapProduct(p, i, originalPriceOverrides.get(p.id), minVariationSizes.get(p.id)));
}

