import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoaLibraryHero from "@/components/CoaLibraryHero";
import { getProductPageData } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "COA Library — Anvil Compounds",
  description: "Certificates of Analysis for every Anvil Compounds research batch — HPLC, mass spectrometry, and endotoxin screening results.",
};

// Bacteriostatic Water (bac-water) is deliberately excluded — it's a
// reconstitution solvent, not a tested research compound, so it has no COA.
const KNOWN_SLUGS = [
  "bpc-157",
  "ac2t",
  "ac3r",
  "klow",
  "ghk-cu",
  "tb-500",
  "mots-c",
  "nad-plus",
  "tesamorelin",
  "cjc-1295-ipamorelin",
  "5-amino-1mq",
  "bpc-157-tb-500",
  "glow",
  "semax",
  "selank",
];

export default async function COAsPage() {
  const products = (
    await Promise.all(KNOWN_SLUGS.map((slug) => getProductPageData(slug)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <main className="min-h-screen bg-mock-graphite">
      <Navbar />

      <CoaLibraryHero
        products={products.map((p) => ({
          slug: p.slug,
          name: p.name,
          category: p.category,
          documentationImage: p.documentationImage,
          documentationFile: p.documentationFile,
          documentationCaption: p.documentationCaption,
          sizes: p.sizes,
          sizesDocumentationFiles: p.sizesDocumentationFiles,
        }))}
      />

      <Footer />
    </main>
  );
}
