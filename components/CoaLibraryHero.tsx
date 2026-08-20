"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import CoaLibraryGrid from "@/components/CoaLibraryGrid";

interface CoaProduct {
  slug: string;
  name: string;
  category: string;
  documentationImage?: string | null;
  documentationFile?: string | null;
  documentationCaption?: string;
  sizes?: string[];
  sizesDocumentationFiles?: (string | null)[];
}

// Same hero-bg.jpeg + white overlay + radial-gradient treatment as
// HeroSection.tsx (homepage) and app/learn/page.tsx — reused here per
// request so the COA Library heading sits on the same light "scientific"
// banner instead of the page's dark bg-mock-graphite.
export default function CoaLibraryHero({ products }: { products: CoaProduct[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <>
      <section className="relative overflow-hidden" style={{ minHeight: "clamp(320px, 44vh, 500px)" }}>
        <Image
          src="/images/hero-bg.jpeg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-white/25" />

        <div className="relative z-10 flex items-center justify-center h-full w-full pt-28 pb-12 md:pt-36 md:pb-16 px-4">
          <div
            className="flex flex-col items-center text-center px-4 py-6 max-w-2xl"
            style={{ background: "radial-gradient(ellipse 80% 90% at 50% 50%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.18) 60%, transparent 100%)" }}
          >
            <p className="font-mono text-xs text-blue-600 tracking-[0.2em] uppercase mb-3">
              Documentation & Quality
            </p>
            <h1 className="font-heading font-700 text-4xl md:text-5xl text-gray-950 mb-4" style={{ textShadow: "0 1px 12px rgba(255,255,255,0.95)" }}>
              COA <span className="font-800 italic" style={{ color: "#1D6ADB" }}>Library</span>
            </h1>
            <p className="font-body text-gray-700 text-base max-w-xl mx-auto mb-8">
              Certificate of Analysis for every batch, verified by an accredited independent
              third-party laboratory — HPLC purity, mass spectrometry identity, and endotoxin screening.
            </p>

            <div className="relative w-full max-w-md">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search compounds…"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/90 border border-gray-300 text-gray-900 placeholder:text-gray-500 font-body text-sm focus:outline-none focus:border-blue-500/60 shadow-sm transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pt-14 pb-24">
        <CoaLibraryGrid products={filtered} query={query} />
      </div>
    </>
  );
}
