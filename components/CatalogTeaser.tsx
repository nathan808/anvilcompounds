"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { CATALOG_TRUST_BADGES } from "@/components/ProductsSection";
import { getProductDisplayTitle } from "@/lib/productTitle";
import type { ProductCard } from "@/lib/woocommerce";

// Slugs for the fixed preview list only (see PREVIEW_NAMES in app/page.tsx) —
// not the full catalog's name->slug map, which lives in ProductsSection.
const PREVIEW_SLUGS: Record<string, string> = {
  "NAD+": "nad-plus",
  "5-Amino-1MQ": "5-amino-1mq",
  "MOTS-c": "mots-c",
  "GHK-Cu": "ghk-cu",
  Semax: "semax",
};

function PreviewCard({ product }: { product: ProductCard }) {
  const slug = PREVIEW_SLUGS[product.name] ?? "";
  const href = `/gate?redirect=${encodeURIComponent(`/products/${slug}`)}`;

  return (
    <Link
      href={href}
      className="group glass-card rounded-xl overflow-hidden flex flex-col transition-all duration-500 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-600/10 hover:-translate-y-1"
    >
      <div className="relative w-full h-[130px] md:h-[150px] bg-white overflow-hidden shrink-0">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain scale-[1.3] transition-transform duration-500 group-hover:scale-[1.38]"
            sizes="(max-width: 768px) 40vw, 18vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl text-blue-300/40">{product.icon}</span>
          </div>
        )}

        {/* Preview ribbon -- distinguishes these from the real catalog cards */}
        <div className="absolute top-2 left-2 z-20">
          <span className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full border border-blue-400/40 bg-navy-950/70 text-blue-300 backdrop-blur-sm">
            Preview
          </span>
        </div>

        {!product.hasCoa && (
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-navy-950/60 flex flex-col items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="font-mono text-[9px] text-yellow-300 tracking-[0.15em] uppercase text-center px-2">
              Testing in Progress
            </span>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4">
        <h3 className="font-display font-700 text-sm md:text-base text-white leading-tight mb-0.5 line-clamp-1">
          {getProductDisplayTitle(product.name, product.category)}
        </h3>
        <span className="font-mono text-[9px] md:text-[10px] text-blue-400/70 tracking-widest uppercase block mb-2">
          {product.category}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] md:text-xs text-white/40 group-hover:text-blue-400 transition-colors duration-300">
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
    <section className="relative bg-navy-950 py-24 md:py-32">
      <div className="absolute inset-0 mesh-bg opacity-60" />

      <div ref={ref} className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mb-6"
        >
          {CATALOG_TRUST_BADGES.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5"
            >
              <span className="text-blue-400 shrink-0">{badge.icon}</span>
              <span className="font-mono text-[11px] text-white/50 tracking-wide whitespace-nowrap">
                {badge.label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="w-6 h-px bg-blue-600" />
          <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
            002 / Research Catalog
          </span>
          <div className="w-6 h-px bg-blue-600" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-800 text-white mb-4"
          style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
        >
          Reference materials
          <br />
          <span className="text-blue-400">&amp; research compounds</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-body text-white/45 text-lg max-w-xl mx-auto mb-8"
        >
          Each compound is a synthetic reference material supplied for
          in-vitro laboratory research.
        </motion.p>

        {previewProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mb-10"
          >
            <p className="font-mono text-[11px] text-white/30 tracking-[0.2em] uppercase mb-4">
              Showing {previewProducts.length} of {totalCount} compounds — verify to view
              full catalog &amp; pricing
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 text-left">
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
            className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
          >
            Browse Full Catalog →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
