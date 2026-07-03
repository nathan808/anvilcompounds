import type { ProductPageData } from "@/components/ProductPageTemplate";

// ─── Product page data fetching ────────────────────────────────────────────────

const SLUG_TO_WC_ID: Record<string, number> = {
  "bpc-157":    332,
  "t1rz":       333,
  "r3ta":       337,
  "klow":       335,
  "ghk-cu":     336,
  "tb-500":     354,
  "mots-c":     346,
  "bac-water":  349,
  // New SKUs — DRAFT until COA + images are live
  "nad-plus":              443,
  "tesamorelin":           445,
  "cjc-1295-ipamorelin":   446,
  "5-amino-1mq":           450,
  "bpc-157-tb-500":        447,
  "glow":                  449,
};

const SLUG_TO_NAME: Record<string, string> = {
  "bpc-157":    "BPC-157",
  "t1rz":       "T1rz",
  "r3ta":       "R3ta",
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
};

const SLUG_TO_CATEGORY: Record<string, string> = {
  "bpc-157":    "Repair & Recovery Research",
  "t1rz":       "Metabolic Research",
  "r3ta":       "Metabolic Research",
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
};

const SLUG_TO_ICON: Record<string, string> = {
  "bpc-157":    "⬡",
  "t1rz":       "◇",
  "r3ta":       "⬟",
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
};

const RELATED_MAP: Record<string, string[]> = {
  "bpc-157":    ["tb-500", "bpc-157-tb-500", "glow"],
  "t1rz":       ["r3ta", "mots-c", "5-amino-1mq"],
  "r3ta":       ["t1rz", "mots-c", "nad-plus"],
  "klow":       ["glow", "ghk-cu", "bpc-157"],
  "ghk-cu":     ["glow", "klow", "bpc-157"],
  "tb-500":     ["bpc-157", "bpc-157-tb-500", "glow"],
  "mots-c":     ["nad-plus", "5-amino-1mq", "r3ta"],
  "bac-water":  ["bpc-157", "tb-500", "ghk-cu"],
  "nad-plus":            ["5-amino-1mq", "mots-c", "tesamorelin"],
  "tesamorelin":         ["cjc-1295-ipamorelin", "nad-plus", "mots-c"],
  "cjc-1295-ipamorelin": ["tesamorelin", "nad-plus", "mots-c"],
  "5-amino-1mq":         ["nad-plus", "mots-c", "t1rz"],
  "bpc-157-tb-500":      ["bpc-157", "tb-500", "glow"],
  "glow":                ["klow", "ghk-cu", "bpc-157-tb-500"],
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
  const opts = { next: { revalidate: 3600 } };

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
}

const PRODUCT_PAGE_URLS: Record<string, string> = {
  "BPC-157":                                      "https://anvilcompounds.shop/product/bpc-157/",
  "T1rz":                                         "https://anvilcompounds.shop/product/t1rz/",
  "Trz- dual receptor":                           "https://anvilcompounds.shop/product/trz/",
  "R3ta":                                         "https://anvilcompounds.shop/product/r3ta/",
  "Rta - triple agonist":                         "https://anvilcompounds.shop/product/rta/",
  "triple agonist (R)":                           "https://anvilcompounds.shop/product/rta/",
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
  "T1rz":                                         "/products/tirz.png",
  "Trz- dual receptor":                           "/products/tirz.png",
  "R3ta":                                         "/products/reta.png",
  "Rta - triple agonist":                         "/products/reta.png",
  "triple agonist (R)":                           "/products/reta.png",
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
  };
}

export async function getProducts(): Promise<ProductCard[]> {
  const url    = process.env.WC_URL;
  const key    = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  const res = await fetch(
    `${url}/wp-json/wc/v3/products?consumer_key=${key}&consumer_secret=${secret}&status=publish&per_page=20`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);

  const products: WCProduct[] = await res.json();
  return products.map(mapProduct);
}
