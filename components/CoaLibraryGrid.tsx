"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { getProductDisplayTitle, isLoginGatedCompound } from "@/lib/productTitle";
import { simplifySizeLabel } from "@/lib/reconstitution";

interface CoaProduct {
  slug: string;
  name: string;
  category: string;
  documentationImage?: string | null;
  documentationFile?: string | null;
  documentationCaption?: string;
  // Per-size COA, aligned index-for-index with `sizes` — same shape as the
  // product page (see ProductHero) so a multi-size product like GLP-RT or
  // GLP-TRZ can show the right COA for whichever size is selected instead
  // of one COA for the whole product.
  sizes?: string[];
  sizesDocumentationFiles?: (string | null)[];
}

// Search input lives in CoaLibraryHero (it's part of the light banner now),
// so this component just renders the already-filtered grid — `query` is
// only used for the empty-state message.
export default function CoaLibraryGrid({ products, query = "" }: { products: CoaProduct[]; query?: string }) {
  if (products.length === 0) {
    return <p className="text-center font-body text-white/55 text-sm">No compounds match "{query}"</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((product) => (
        <CoaCard key={product.slug} product={product} />
      ))}
    </div>
  );
}

// Outer element is a plain div, not a <button> — the card can contain its
// own size-selection <button>s (for GLP-RT/GLP-TRZ-style multi-size
// products), and a <button> nested inside a <button> is invalid HTML (same
// class of bug fixed on the catalog cards — see ProductsSection.tsx). Each
// card owns its own selected-size state so picking a size here doesn't
// require leaving the card, matching how the product page works; the chosen
// index is passed to the COA guide page via a ?size= query param.
function CoaCard({ product }: { product: CoaProduct }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [sizeIndex, setSizeIndex] = useState(0);
  const hasCoa = Boolean(
    product.documentationImage ||
    product.documentationFile ||
    product.sizesDocumentationFiles?.some(Boolean)
  );
  const hasSizes = (product.sizes?.length ?? 0) > 1;
  const guideHref = `/coas/${product.slug}${hasSizes ? `?size=${sizeIndex}` : ""}`;

  const handleView = () => {
    // GLP compounds' COAs are gated behind login; everything else stays
    // open to guests. Checkout is already gated the same way, so this
    // never asks a guest to log in twice for the same reason.
    if (isLoginGatedCompound(product.name) && !isAuthenticated) {
      router.push("/account?redirect=/coas");
      return;
    }
    router.push(guideHref);
  };

  return (
    <div
      className={`group bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col justify-between transition-all duration-200 ${
        hasCoa ? "hover:border-mock-cobaltLight/40 hover:-translate-y-0.5" : ""
      }`}
    >
      <div>
        <p className="font-mono text-[10px] text-mock-cobaltLight tracking-widest uppercase mb-2">
          {product.category}
        </p>
        <h2 className="font-heading font-700 text-[#EAF0FA] text-lg mb-1">
          {getProductDisplayTitle(product.name, product.category)}
        </h2>
        {product.documentationCaption && (
          <p className="font-mono text-xs text-[#AEBBD0] leading-relaxed mt-3">
            {product.documentationCaption}
          </p>
        )}
      </div>

      {hasSizes && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {product.sizes!.map((size, i) => (
            <button
              key={size}
              onClick={() => setSizeIndex(i)}
              className={`px-2.5 py-1 rounded-md border font-mono text-[11px] transition-colors ${
                i === sizeIndex
                  ? "bg-mock-cobalt border-mock-cobaltInk text-white"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
              }`}
            >
              {simplifySizeLabel(size)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {hasCoa ? (
          <button
            onClick={handleView}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-mock-cobalt group-hover:bg-mock-cobaltInk text-white font-display font-700 text-sm transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View COA
          </button>
        ) : (
          <span className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-700 text-sm cursor-not-allowed">
            COA Pending
          </span>
        )}
      </div>
    </div>
  );
}
