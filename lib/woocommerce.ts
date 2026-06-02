import type { ProductPageData } from "@/components/ProductPageTemplate";

// ─── Product page data fetching ────────────────────────────────────────────────

const SLUG_TO_WC_ID: Record<string, number> = {
  "bpc-157":    332,
  "semaglutide": 334,
  "tirzepatide": 333,
  "retatrutide": 337,
  "kglow":      335,
  "ghk-cu":     336,
  "tb-500":     354,
  "mots-c":     346,
  "bac-water":  349,
};

const SLUG_TO_NAME: Record<string, string> = {
  "bpc-157":    "BPC-157",
  "semaglutide": "Semaglutide",
  "tirzepatide": "Tirzepatide",
  "retatrutide": "Retatrutide",
  "kglow":      "KGLOW",
  "ghk-cu":     "GHK-Cu",
  "tb-500":     "TB-500",
  "mots-c":     "MOTS-c",
  "bac-water":  "Bacteriostatic Water",
};

const SLUG_TO_CATEGORY: Record<string, string> = {
  "bpc-157":    "Repair & Recovery",
  "semaglutide": "GLP-1 Class",
  "tirzepatide": "GLP-1 Class",
  "retatrutide": "GLP-1 Class",
  "kglow":      "Repair & Recovery",
  "ghk-cu":     "Cosmetic & Longevity",
  "tb-500":     "Repair & Recovery",
  "mots-c":     "Metabolic",
  "bac-water":  "Research Supplies",
};

const SLUG_TO_ICON: Record<string, string> = {
  "bpc-157":    "⬡",
  "semaglutide": "◈",
  "tirzepatide": "◇",
  "retatrutide": "⬟",
  "kglow":      "✦",
  "ghk-cu":     "⬢",
  "tb-500":     "◉",
  "mots-c":     "⬥",
  "bac-water":  "◎",
};

const RELATED_MAP: Record<string, string[]> = {
  "bpc-157":    ["ghk-cu", "semaglutide", "tirzepatide"],
  "semaglutide": ["tirzepatide", "retatrutide", "bpc-157"],
  "tirzepatide": ["retatrutide", "semaglutide", "bpc-157"],
  "retatrutide": ["tirzepatide", "semaglutide", "bpc-157"],
  "kglow":      ["bpc-157", "ghk-cu", "semaglutide"],
  "ghk-cu":     ["bpc-157", "kglow", "retatrutide"],
  "tb-500":     ["bpc-157", "ghk-cu", "mots-c"],
  "mots-c":     ["ghk-cu", "bpc-157", "retatrutide"],
  "bac-water":  ["bpc-157", "tb-500", "ghk-cu"],
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

    const relatedProducts = (RELATED_MAP[slug] ?? []).slice(0, 3).map((s) => ({
      slug: s,
      name:     SLUG_TO_NAME[s]     ?? s,
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
      image:       product.images[0]?.src ?? null,
      trustBadges,
      whatItIsSubtitle:    meta["what_it_is_subtitle"]         ?? `${product.name} | Research Use Only`,
      whatItIsBody:        meta["what_it_is_body"]             ?? "",
      compositionBody:     meta["composition_body"]            || undefined,
      researchApplications,
      documentationHeading: meta["documentation_section_heading"] ?? "Documentation & Quality",
      documentationMetrics,
      documentationFile:    meta["documentation_file"]          ?? null,
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
  { label: "Bestseller",     color: "bg-blue-600/20 text-blue-300 border-blue-600/30" },
  { label: "High Demand",    color: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30" },
  { label: "Advanced",       color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30" },
  { label: "Exclusive Blend",color: "bg-purple-600/20 text-purple-300 border-purple-600/30" },
  { label: "Entry Point",    color: "bg-teal-600/20 text-teal-300 border-teal-600/30" },
  { label: "Cutting Edge",   color: "bg-rose-600/20 text-rose-300 border-rose-600/30" },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
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
  "BPC-157":              "https://anvilcompounds.shop/product/bpc-157/",
  "Semaglutide":          "https://anvilcompounds.shop/semaglutide/",
  "Tirzepatide":          "https://anvilcompounds.shop/tirzepatide/",
  "Retatrutide":          "https://anvilcompounds.shop/reta/",
  "KGLOW":                "https://anvilcompounds.shop/klow/",
  "GHK-Cu":               "https://anvilcompounds.shop/ghkcu/",
  "TB-500":               "https://anvilcompounds.shop/tb500/",
  "Bacteriostatic Water": "https://anvilcompounds.shop/bac-water/",
  "MOTS-c":               "https://anvilcompounds.shop/motsc/",
};

export function mapProduct(product: WCProduct, index: number): ProductCard {
  const badge = BADGES[index % BADGES.length];
  return {
    id:          product.id,
    name:        product.name,
    category:    product.categories[0]?.name ?? "Research Compound",
    description: stripHtml(product.short_description) || "Research-grade compound with full COA documentation.",
    price:       product.price ? `$${product.price}` : "—",
    purity:      getAttribute(product, "Purity") ?? "99%+",
    badge:       getAttribute(product, "Badge")  ?? badge.label,
    badgeColor:  badge.color,
    icon:        ICONS[index % ICONS.length],
    permalink:   PRODUCT_PAGE_URLS[product.name] ?? product.permalink,
    image:       product.images[0]?.src ?? null,
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
