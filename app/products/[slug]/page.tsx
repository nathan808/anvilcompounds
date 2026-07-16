import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductPageTemplate from "@/components/ProductPageTemplate";
import { getProductPageData } from "@/lib/woocommerce";
import { getProductDisplayTitle } from "@/lib/productTitle";

export const dynamicParams = true;

const KNOWN_SLUGS = [
  "bpc-157",
  "glp-trz",
  "glp-rt",
  "klow",
  "ghk-cu",
  "tb-500",
  "bac-water",
  "mots-c",
  // New SKUs — Testing in Progress (no COA yet)
  "nad-plus",
  "tesamorelin",
  "cjc-1295-ipamorelin",
  "5-amino-1mq",
  "bpc-157-tb-500",
  "glow",
  "semax",
  "selank",
];

export async function generateStaticParams() {
  return KNOWN_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductPageData(params.slug);
  if (!product) {
    return { title: "Product — Anvil Compounds" };
  }
  const displayTitle = getProductDisplayTitle(product.name, product.category);
  return {
    title: `${displayTitle} — Anvil Compounds`,
    description: product.subtitle || `${displayTitle} — research-grade compound. Independent hexa-method testing. Ships same day.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductPageData(params.slug);

  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-16">
        <ProductPageTemplate product={product} />
      </main>
      <Footer />
    </>
  );
}
