import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductPageTemplate from "@/components/ProductPageTemplate";
import { getProductPageData } from "@/lib/woocommerce";

const KNOWN_SLUGS = [
  "bpc-157",
  "semaglutide",
  "tirzepatide",
  "retatrutide",
  "kglow",
  "ghk-cu",
  "tb-500",
  "bac-water",
  "mots-c",
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
  return {
    title: `${product.name} — Anvil Compounds`,
    description: product.subtitle || `${product.name} — research-grade compound. Independent triple-method testing. Ships same day.`,
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
