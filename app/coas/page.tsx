import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoaLibraryGrid from "@/components/CoaLibraryGrid";
import { getProductPageData } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "COA Library — Anvil Compounds",
  description: "Certificates of Analysis for every Anvil Compounds research batch — HPLC, mass spectrometry, and endotoxin screening results.",
};

// Bacteriostatic Water (bac-water) is deliberately excluded — it's a
// reconstitution solvent, not a tested research compound, so it has no COA.
const KNOWN_SLUGS = [
  "bpc-157",
  "glp-trz",
  "glp-rt",
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

      <div className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-mock-cobaltLight tracking-[0.2em] uppercase mb-3">
            Documentation & Quality
          </p>
          <h1 className="font-heading font-700 text-4xl md:text-5xl text-[#EAF0FA] mb-4">
            COA <span className="font-800 italic text-mock-cobaltLight">Library</span>
          </h1>
          <p className="font-body text-[#AEBBD0] text-base max-w-xl mx-auto">
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
            sizes: p.sizes,
            sizesDocumentationFiles: p.sizesDocumentationFiles,
          }))}
        />
      </div>

      <Footer />
    </main>
  );
}
