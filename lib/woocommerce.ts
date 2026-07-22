import type { ProductPageData } from "@/components/ProductPageTemplate";

// ─── Product page data fetching ────────────────────────────────────────────────

const SLUG_TO_WC_ID: Record<string, number> = {
  "bpc-157":    332,
  "glp-trz":    333,
  "glp-rt":     337,
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

// Safety Data Sheets — static files under public/documents/sds/, keyed by
// slug rather than pulled from WC meta. No entry for a slug means no source
// PDF exists yet (falls back to the "included with every order" notice in
// SdsPreviewButton) — currently true only for bac-water.
const SLUG_TO_SDS: Record<string, string> = {
  "bpc-157":              "/documents/sds/bpc-157.pdf",
  "glp-trz":              "/documents/sds/glp-trz.pdf",
  "glp-rt":               "/documents/sds/glp-rt.pdf",
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
  "glp-trz":    "GLP-TRZ",
  "glp-rt":     "GLP-RT",
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

const SLUG_TO_CATEGORY: Record<string, string> = {
  "bpc-157":    "Repair & Recovery Research",
  "glp-trz":    "Metabolic Research",
  "glp-rt":     "Metabolic Research",
  "klow":       "Longevity & Cosmetic Research",
  "ghk-cu":     "Longevity & Cosmetic Research",
  "tb-500":     "Repair & Recovery Research",
  "mots-c":     "Metabolic Research",
  "bac-water":  "Research Supplies",
  "nad-plus":              "Metabolic Research",
  "tesamorelin":           "Growth Pathway Research",
  "cjc-1295-ipamorelin":   "Growth Pathway Research",
  "5-amino-1mq":           "Metabolic Research",
  "bpc-157-tb-500":        "Repair & Recovery Research",
  "glow":                  "Longevity & Cosmetic Research",
  "semax":                 "Cognitive Research",
  "selank":                "Cognitive Research",
};

const SLUG_TO_ICON: Record<string, string> = {
  "bpc-157":    "⬡",
  "glp-trz":    "◇",
  "glp-rt":     "⬟",
  "klow":       "✦",
  "ghk-cu":     "⬢",
  "tb-500":     "◉",
  "mots-c":     "⬥",
  "bac-water":  "◎",
  "nad-plus":              "◑",
  "tesamorelin":           "◍",
  "cjc-1295-ipamorelin":   "⬦",
  "5-amino-1mq":           "◆",
  "bpc-157-tb-500":        "⬧",
  "glow":                  "✧",
  "semax":                 "◈",
  "selank":                "◉",
};

const RELATED_MAP: Record<string, string[]> = {
  "bpc-157":    ["tb-500", "bpc-157-tb-500", "glow"],
  "glp-trz":    ["glp-rt", "mots-c", "5-amino-1mq"],
  "glp-rt":     ["glp-trz", "mots-c", "nad-plus"],
  "klow":       ["glow", "ghk-cu", "bpc-157"],
  "ghk-cu":     ["glow", "klow", "bpc-157"],
  "tb-500":     ["bpc-157", "bpc-157-tb-500", "glow"],
  "mots-c":     ["nad-plus", "5-amino-1mq", "glp-rt"],
  "bac-water":  ["bpc-157", "tb-500", "ghk-cu"],
  "nad-plus":            ["5-amino-1mq", "mots-c", "tesamorelin"],
  "tesamorelin":         ["cjc-1295-ipamorelin", "nad-plus", "mots-c"],
  "cjc-1295-ipamorelin": ["tesamorelin", "nad-plus", "mots-c"],
  "5-amino-1mq":         ["nad-plus", "mots-c", "glp-trz"],
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
  type: string;
  price: string;
  regular_price: string;
  description: string;
  short_description: string;
  categories: { id: number; name: string; slug: string }[];
  images: { src: string; alt: string }[];
  meta_data: { id: number; key: string; value: string }[];
}

interface WCVariation {
  id: number;
  price: string;
  regular_price: string;
  attributes: { id: number; name: string; option: string }[];
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
  const opts = { next: { revalidate: 3600, tags: ["wc-products"] } };

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
    const sizes = sortedVars
      .map((v) => v.attributes.find((a) => a.name === "Size")?.option ?? "")
      .filter(Boolean);
    const sizesPrices = sortedVars.map(
      (v) => parseFloat(v.price || v.regular_price || product.price || "0")
    );

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

    const relatedSlugs = (RELATED_MAP[slug] ?? []).slice(0, 3);
    const relatedIds = relatedSlugs.map((s) => SLUG_TO_WC_ID[s]).filter(Boolean);
    const relatedNames: Record<number, string> = {};
    if (relatedIds.length) {
      const relatedRes = await fetch(
        `${url}/wp-json/wc/v3/products?include=${relatedIds.join(",")}&per_page=${relatedIds.length}`,
        { headers, ...opts }
      );
      if (relatedRes.ok) {
        const relatedList: { id: number; name: string }[] = await relatedRes.json();
        for (const r of relatedList) relatedNames[r.id] = r.name;
      }
    }
    const relatedProducts = relatedSlugs.map((s) => ({
      slug: s,
      name:     relatedNames[SLUG_TO_WC_ID[s]] ?? SLUG_TO_NAME[s] ?? s,
      category: SLUG_TO_CATEGORY[s] ?? "Research Compound",
      icon:     SLUG_TO_ICON[s]     ?? "⬡",
    }));

    const basePrice = parseFloat(product.price || product.regular_price || "0");

    return {
      slug,
      name:        product.name,
      category:    product.categories[0]?.name ?? "Research Compounds",
      subtitle:    meta["subtitle"] ?? "",
      price:       `$${basePrice.toFixed(2)}`,
      priceNumber: sizesPrices[0] ?? basePrice,
      priceUnit:   "/ vial",
      sizes:       sizes.length ? sizes : ["Standard"],
      sizesPrices: sizesPrices.length ? sizesPrices : [basePrice],
      wcProductId: product.id,
      image:       LOCAL_PRODUCT_IMAGES[product.name] ?? product.images[0]?.src ?? null,
      trustBadges,
      whatItIsSubtitle:    meta["what_it_is_subtitle"]         ?? `${product.name} | Research Use Only`,
      whatItIsBody:        meta["what_it_is_body"]             ?? "",
      compositionBody:     meta["composition_body"]            || undefined,
      researchApplications,
      documentationHeading: meta["documentation_section_heading"] ?? "Documentation & Quality",
      documentationMetrics,
      documentationFile:    meta["documentation_file"]          ?? null,
      documentationImage:   meta["documentation_image"]         ?? null,
      sdsFile:              SLUG_TO_SDS[slug]                   ?? null,
      moleculeImage:        SLUG_TO_MOLECULE_IMAGE[slug]        ?? null,
      documentationCaption: meta["documentation_caption"]       ?? "",
      propertiesTable,
      shippingType: (meta["shipping_type"] as "standard" | "ambient") ?? "standard",
      relatedProducts,
    };
  } catch {
    return null;
  }
}

// ─── Catalog card helpers (existing) ──────────────────────────────────────────

const ICONS = ["⬡", "◈", "◇", "✦", "⬢", "⬟"];

const BADGES = [
  { label: "Bestseller",     color: "bg-blue-600/70 text-blue-100 border-blue-500/50" },
  { label: "High Demand",    color: "bg-indigo-600/70 text-indigo-100 border-indigo-500/50" },
  { label: "Advanced",       color: "bg-cyan-600/70 text-cyan-100 border-cyan-500/50" },
  { label: "Exclusive Blend",color: "bg-purple-600/70 text-purple-100 border-purple-500/50" },
  { label: "Entry Point",    color: "bg-teal-600/70 text-teal-100 border-teal-500/50" },
  { label: "Cutting Edge",   color: "bg-rose-600/70 text-rose-100 border-rose-500/50" },
];

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

export interface WCProduct {
  id: number;
  name: string;
  short_description: string;
  price: string;
  permalink: string;
  categories: Array<{ name: string }>;
  attributes: Array<{ name: string; options: string[] }>;
  images: Array<{ src: string; alt: string }>;
}

export interface ProductCard {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  purity: string;
  badge: string;
  badgeColor: string;
  icon: string;
  permalink: string;
  image: string | null;
  hasCoa: boolean;
}

// Products without COA yet (Testing in Progress — no buy UI shown)
const IDS_WITHOUT_COA = new Set([443, 445, 446, 450, 447, 449, 510, 511]);

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
  "KLOW":                                         "https://anvilcompounds.shop/product/klow/",
  "GHK-Cu":                                       "https://anvilcompounds.shop/product/ghk-cu/",
  "TB-500":                                       "https://anvilcompounds.shop/product/tb-500/",
  "Bacteriostatic Water":                         "https://anvilcompounds.shop/product/bac-water/",
  "Reconstitution Solution – for Laboratory Use": "https://anvilcompounds.shop/product/bacteriostatic-water/",
  "MOTS-c":                                       "https://anvilcompounds.shop/product/mots-c/",
  "BPC-157 + TB-500":                              "https://anvilcompounds.shop/product/bpc-157-tb-500/",
};

const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  "BPC-157":                                      "/products/bpc157.png",
  "T1rz":                                         "/products/glp-trz.png",
  "Trz- dual receptor":                           "/products/glp-trz.png",
  "Dual Receptor (T)":                            "/products/glp-trz.png",
  "R3ta":                                         "/products/glp-rt.png",
  "Rta - triple agonist":                         "/products/glp-rt.png",
  "triple agonist (R)":                           "/products/glp-rt.png",
  "Triple Agonist (R)":                           "/products/glp-rt.png",
  "GLP-TRZ":                                      "/products/glp-trz.png",
  "GLP-RT":                                       "/products/glp-rt.png",
  "KLOW":                                         "/products/klow.png",
  "GHK-Cu":                                       "/products/ghkcu.png",
  "TB-500":                                       "/products/tb500.png",
  "MOTS-c":                                       "/products/motsc.png",
  "BPC-157 + TB-500":                              "/products/wolverine.png",
  "NAD+":                                         "/products/nad.png",
  "Tesamorelin":                                  "/products/tesa.png",
  "CJC-1295 + Ipamorelin":                        "/products/cjcipa.png",
  "5-Amino-1MQ":                                  "/products/5amino.png",
  "GLOW":                                         "/products/glow.png",
  // Semax + Selank images served directly from WooCommerce gallery (no local copy)
};

export function mapProduct(product: WCProduct, index: number): ProductCard {
  const badge = BADGES[index % BADGES.length];
  return {
    id:          product.id,
    name:        product.name,
    category:    stripHtml(product.categories[0]?.name ?? "Research Compound"),
    description: stripHtml(product.short_description) || "Research-grade compound with full COA documentation.",
    price:       product.price ? `$${product.price}` : "—",
    purity:      getAttribute(product, "Purity") ?? "99%+",
    badge:       getAttribute(product, "Badge")  ?? badge.label,
    badgeColor:  badge.color,
    icon:        ICONS[index % ICONS.length],
    permalink:   PRODUCT_PAGE_URLS[product.name] ?? product.permalink,
    image:       LOCAL_PRODUCT_IMAGES[product.name] ?? product.images[0]?.src ?? null,
    hasCoa:      !IDS_WITHOUT_COA.has(product.id),
  };
}

export async function getProducts(): Promise<ProductCard[]> {
  const url    = process.env.WC_URL;
  const key    = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  const res = await fetch(
    `${url}/wp-json/wc/v3/products?consumer_key=${key}&consumer_secret=${secret}&status=publish&per_page=20`,
    { next: { revalidate: 3600, tags: ["wc-products"] } }
  );

  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);

  const products: WCProduct[] = await res.json();
  return products.map(mapProduct);
}
