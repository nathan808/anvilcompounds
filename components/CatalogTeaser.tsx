"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { getProductDisplayTitle } from "@/lib/productTitle";
import type { ProductCard } from "@/lib/woocommerce";

// Slugs for the fixed preview list only (see PREVIEW_NAMES in app/page.tsx) —
// not the full catalog's name->slug map, which lives in ProductsSection.
const PREVIEW_SLUGS: Record<string, string> = {
  "BPC-157": "bpc-157",
  "GHK-Cu": "ghk-cu",
  "TB-500": "tb-500",
  "GLP-RT": "glp-rt",
  KLOW: "klow",
};

function PreviewCard({ product }: { product: ProductCard }) {
  const slug = PREVIEW_SLUGS[product.name] ?? "";
  const href = `/gate?redirect=${encodeURIComponent(`/products/${slug}`)}`;

  return (
    <Link
      href={href}
      className="group bg-white border border-mock-line rounded-xl overflow-hidden flex flex-col transition-all duration-500 hover:border-mock-cobalt/40 hover:shadow-xl hover:shadow-mock-cobalt/10 hover:-translate-y-1"
    >
      {/* Container aspect matches the source photos (1500x1858) so
          object-contain fills it edge-to-edge with no forced zoom --
          keeps the full frame (vial + info card) in view instead of
          center-cropping it. */}
      <div className="relative w-full aspect-[1500/1858] bg-white overflow-hidden shrink-0">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl text-blue-300/40">{product.icon}</span>
          </div>
        )}

        {/* Preview ribbon -- distinguishes these from the real catalog cards */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <span className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full border border-mock-cobaltLight/40 bg-mock-graphite/70 text-mock-cobaltLight backdrop-blur-sm">
            Preview
          </span>
        </div>
      </div>

      <div className="p-3 md:p-5">
        <h3 className="font-display font-700 text-base md:text-xl text-mock-navy leading-tight mb-0.5 line-clamp-1">
          {getProductDisplayTitle(product.name, product.category)}
        </h3>
        <span className="font-mono text-[9px] md:text-[10px] text-mock-cobaltInk/70 tracking-widest uppercase block mb-2">
          {product.category}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] md:text-xs text-mock-sub group-hover:text-mock-cobalt transition-colors duration-300">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Verify to view →
        </span>
      </div>
    </Link>
  );
}

// Replaces the inline product grid on the homepage — the real catalog (with
// actual product names/prices) now lives on /catalog, which sits behind the
// verification gate (see middleware.ts). This teaser is pure marketing copy
// plus a no-price preview of a few of the lowest-scrutiny compounds, so it's
// deliberately left off the gate and stays indexable.
export default function CatalogTeaser({
  previewProducts,
  totalCount,
}: {
  previewProducts: ProductCard[];
  totalCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section className="relative bg-mock-page py-[76px]">
      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="w-6 h-px bg-mock-cobalt" />
          <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.25em] uppercase">
            002 / Research Catalog
          </span>
          <div className="w-6 h-px bg-mock-cobalt" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading font-700 text-mock-navy mb-6"
          style={{ fontSize: "clamp(1.9rem, 3.96vw, 3.15rem)" }}
        >
          <span>Peptide &amp; Research Reagent Catalog</span>
        </motion.h2>

        {previewProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mb-7"
          >
            <p className="font-mono text-[11px] text-mock-sub tracking-[0.2em] uppercase mb-3">
              Showing {previewProducts.length} of {totalCount} compounds, verify to view
              full catalog &amp; pricing
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-left">
              {previewProducts.map((product) => (
                <PreviewCard key={product.id} product={product} />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="/catalog?catalog=full"
            className="inline-block px-7 py-3 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30"
          >
            Browse Full Catalog →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
