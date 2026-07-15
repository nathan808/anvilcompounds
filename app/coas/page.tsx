import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoaLibraryGrid from "@/components/CoaLibraryGrid";
import { getProductPageData } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "COA Library — Anvil Compounds",
  description: "Certificates of Analysis for every Anvil Compounds research batch — HPLC, mass spectrometry, and endotoxin screening results.",
};

const KNOWN_SLUGS = [
  "bpc-157",
  "glp-trz",
  "glp-rt",
  "klow",
  "ghk-cu",
  "tb-500",
  "bac-water",
  "mots-c",
  "nad-plus",
  "tesamorelin",
  "cjc-1295-ipamorelin",
  "5-amino-1mq",
  "bpc-157-tb-500",
  "glow",
];

export default async function COAsPage() {
  const products = (
    await Promise.all(KNOWN_SLUGS.map((slug) => getProductPageData(slug)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <main className="min-h-screen bg-navy-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-blue-400/70 tracking-[0.2em] uppercase mb-3">
            Documentation & Quality
          </p>
          <h1 className="font-display font-700 text-4xl md:text-5xl text-white mb-4">
            COA Library
          </h1>
          <p className="font-body text-white/40 text-base max-w-xl mx-auto">
            Certificate of Analysis for every batch, verified by an accredited independent
            third-party laboratory — HPLC purity, mass spectrometry identity, and endotoxin screening.
          </p>
        </div>

        <CoaLibraryGrid
          products={products.map((p) => ({
            slug: p.slug,
            name: p.name,
            category: p.category,
            documentationImage: p.documentationImage,
            documentationFile: p.documentationFile,
            documentationCaption: p.documentationCaption,
          }))}
        />
      </div>

      <Footer />
    </main>
  );
}
