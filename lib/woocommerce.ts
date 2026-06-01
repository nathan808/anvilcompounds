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
  categories: Array<{ name: string }>;
  attributes: Array<{ name: string; options: string[] }>;
}

export interface ProductCard {
  name: string;
  category: string;
  description: string;
  price: string;
  purity: string;
  badge: string;
  badgeColor: string;
  icon: string;
}

export function mapProduct(product: WCProduct, index: number): ProductCard {
  const badge = BADGES[index % BADGES.length];
  return {
    name:        product.name,
    category:    product.categories[0]?.name ?? "Research Compound",
    description: stripHtml(product.short_description) || "Research-grade compound with full COA documentation.",
    price:       product.price ? `$${product.price}` : "—",
    purity:      getAttribute(product, "Purity") ?? "99%+",
    badge:       getAttribute(product, "Badge")  ?? badge.label,
    badgeColor:  badge.color,
    icon:        ICONS[index % ICONS.length],
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
