import type { MetadataRoute } from "next";

const BASE = "https://www.anvilcompounds.shop";

const PRODUCT_SLUGS = [
  "bpc-157", "t1rz", "r3ta", "klow", "ghk-cu", "tb-500", "mots-c", "bac-water",
  "bpc-157-tb-500", "nad-plus", "tesamorelin", "cjc-1295-ipamorelin", "5-amino-1mq", "glow",
];

async function getBlogSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/api/blog`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const posts = await res.json();
    return Array.isArray(posts) ? posts.map((p: { slug: string }) => p.slug) : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogSlugs = await getBlogSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,         lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/faq`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/blog`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
  ];

  const productRoutes: MetadataRoute.Sitemap = PRODUCT_SLUGS.map((slug) => ({
    url:             `${BASE}/products/${slug}`,
    lastModified:    new Date(),
    changeFrequency: "monthly" as const,
    priority:        0.9,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url:             `${BASE}/blog/${slug}`,
    lastModified:    new Date(),
    changeFrequency: "monthly" as const,
    priority:        0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
