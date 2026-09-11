import type { MetadataRoute } from "next";

const BASE = "https://www.anvilcompounds.shop";

const PRODUCT_SLUGS = [
  "bpc-157", "ac2t", "ac3r", "klow", "ghk-cu", "tb-500", "mots-c", "bac-water",
  "bpc-157-tb-500", "nad-plus", "tesamorelin", "cjc-1295-ipamorelin", "5-amino-1mq", "glow",
  "semax", "selank",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
  ];

  const productRoutes: MetadataRoute.Sitemap = PRODUCT_SLUGS.map((slug) => ({
    url:             `${BASE}/products/${slug}`,
    lastModified:    new Date(),
    changeFrequency: "monthly" as const,
    priority:        0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}
