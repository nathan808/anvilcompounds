import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoaGuideViewer from "@/components/CoaGuideViewer";
import CoaBackButton from "@/components/CoaBackButton";
import SdsPreviewButton from "@/components/SdsPreviewButton";
import { getProductPageData } from "@/lib/woocommerce";
import { getProductDisplayTitle } from "@/lib/productTitle";

interface CoaGuidePageProps {
  params: { slug: string };
  searchParams: { size?: string };
}

export async function generateMetadata({ params }: CoaGuidePageProps): Promise<Metadata> {
  const product = await getProductPageData(params.slug);
  if (!product) return { title: "COA Guide — Anvil Compounds" };
  return {
    title: `${product.name} COA Guide — Anvil Compounds`,
    description: `Certificate of Analysis, Safety Data Sheet, and properties for ${product.name} — independently tested via HPLC, mass spectrometry, and endotoxin screening.`,
  };
}

export default async function CoaGuidePage({ params, searchParams }: CoaGuidePageProps) {
  const product = await getProductPageData(params.slug);

  if (!product || !product.coaApplicable) notFound();

  const hasCoa =
    Boolean(product.documentationImage) || product.sizesDocumentationFiles.some(Boolean);

  const initialSizeIndex = (() => {
    const parsed = parseInt(searchParams.size ?? "", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  })();

  return (
    <main className="min-h-screen bg-mock-graphite">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 space-y-8">
        <div>
          <CoaBackButton />
          {/* Plain <div>, not <nav> — a global [data-theme="light"] nav
              rule (app/globals.css) puts a light background on every <nav>
              element site-wide, which was bleeding onto this breadcrumb. */}
          <div className="font-mono text-xs font-700 text-white mb-4">
            <Link href="/coas" className="hover:text-mock-cobaltLight transition-colors">
              COA Library
            </Link>
            <span className="mx-2 text-white/40">/</span>
            <span>{product.name}</span>
          </div>
          <p className="font-mono text-xs text-mock-cobaltLight tracking-[0.2em] uppercase mb-3">
            Documentation & Quality
          </p>
          <h1 className="font-heading font-700 text-3xl md:text-4xl text-[#EAF0FA]">
            {getProductDisplayTitle(product.name, product.category)}
          </h1>
          {product.documentationCaption && (
            <p className="font-mono text-sm text-[#AEBBD0] leading-relaxed mt-3 max-w-2xl">
              {product.documentationCaption}
            </p>
          )}
        </div>

        {hasCoa ? (
          <CoaGuideViewer
            title={product.name}
            documentationImage={product.documentationImage}
            sizes={product.sizes}
            sizesDocumentationFiles={product.sizesDocumentationFiles}
            initialSizeIndex={initialSizeIndex}
          />
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-10 text-center">
            <p className="font-mono text-sm text-white/50">
              COA testing is in progress for this batch — check back soon.
            </p>
          </div>
        )}

        {product.propertiesTable.length > 0 && (
          <div className="bg-white border border-mock-line rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-mock-line">
              <h2 className="font-display font-700 text-mock-navy text-sm tracking-wide">
                Properties
              </h2>
            </div>
            <table className="w-full">
              <tbody>
                {product.propertiesTable.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-mock-surface2/50" : ""}>
                    <td className="px-5 py-3 font-mono text-xs text-mock-sub uppercase tracking-wide w-1/3">
                      {row.label}
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-mock-navy">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <SdsPreviewButton productName={product.name} fileUrl={product.sdsFile} />
          <Link
            href={`/products/${product.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm transition-all duration-200"
          >
            Source this research material →
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
