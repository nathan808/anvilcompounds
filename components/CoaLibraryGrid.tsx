"use client";

import { useMemo, useState } from "react";
import CoaModal from "@/components/CoaModal";

interface CoaProduct {
  slug: string;
  name: string;
  category: string;
  documentationImage?: string | null;
  documentationFile?: string | null;
  documentationCaption?: string;
}

export default function CoaLibraryGrid({ products }: { products: CoaProduct[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<CoaProduct | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <>
      <div className="max-w-md mx-auto mb-10">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
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
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 font-body text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center font-body text-white/30 text-sm">No compounds match "{query}"</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => {
            const hasCoa = Boolean(product.documentationImage || product.documentationFile);
            return (
              <button
                key={product.slug}
                onClick={() => hasCoa && setActive(product)}
                disabled={!hasCoa}
                className={`group text-left glass-card rounded-xl p-6 flex flex-col justify-between transition-all duration-200 ${
                  hasCoa ? "hover:border-blue-500/40 hover:-translate-y-0.5 cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <div>
                  <p className="font-mono text-[10px] text-white/35 tracking-widest uppercase mb-2">
                    {product.category}
                  </p>
                  <h2 className="font-display font-700 text-white text-lg mb-1">{product.name}</h2>
                  {product.documentationCaption && (
                    <p className="font-mono text-xs text-white/30 leading-relaxed mt-3">
                      {product.documentationCaption}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  {hasCoa ? (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white font-display font-700 text-sm transition-all duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View COA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/30 font-display font-700 text-sm opacity-40">
                      COA Pending
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CoaModal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active?.name ?? ""}
        imageUrl={active?.documentationImage}
        fileUrl={active?.documentationFile}
      />
    </>
  );
}
