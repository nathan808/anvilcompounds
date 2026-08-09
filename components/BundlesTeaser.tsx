"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import type { ProductCard } from "@/lib/woocommerce";

// Slugs for the 5 Research Bundles — mirrors PREVIEW_SLUGS in CatalogTeaser,
// kept separate since bundles aren't part of that component's fixed preview
// list and use their own slug set (see lib/woocommerce.ts SLUG_TO_WC_ID).
const BUNDLE_SLUGS: Record<string, string> = {
  "Energy Research Bundle": "energy-research-bundle",
  "GHRH Bundle": "ghrh-bundle",
  "Metabolic Research Bundle": "metabolic-research-bundle",
  "Full Research Bundle": "full-research-bundle",
  "Cognitive Research Bundle": "cognitive-research-bundle",
};

function BundleCard({ bundle }: { bundle: ProductCard }) {
  const slug = BUNDLE_SLUGS[bundle.name] ?? "";
  const href = `/gate?redirect=${encodeURIComponent(`/products/${slug}`)}`;

  return (
    <Link
      href={href}
      className="group bg-white border border-mock-line rounded-xl overflow-hidden flex flex-col transition-all duration-500 hover:border-mock-cobalt/40 hover:shadow-xl hover:shadow-mock-cobalt/10 hover:-translate-y-1"
    >
      {/* Same 1195x1600 aspect ratio as the rest of the Aug 2026 photo batch
          (see CatalogTeaser / ProductsSection) so bundle photos sit flush
          with no letterboxing. */}
      <div className="relative w-full aspect-[1195/1600] bg-white overflow-hidden shrink-0">
        {bundle.image ? (
          <Image
            src={bundle.image}
            alt={bundle.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl text-blue-300/40">{bundle.icon}</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 z-20">
          <span className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full border border-mock-cobaltLight/40 bg-mock-graphite/70 text-mock-cobaltLight backdrop-blur-sm">
            Preview
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5 z-20">
          <span className="text-[9px] font-display font-700 tracking-wide px-2 py-0.5 rounded-full bg-green-600 text-white shadow-md">
            Bundle Deal
          </span>
        </div>
      </div>

      <div className="p-3 md:p-5">
        <h3 className="font-display font-700 text-base md:text-xl text-mock-navy leading-tight mb-0.5 line-clamp-1">
          {bundle.name}
        </h3>
        <span className="font-mono text-[9px] md:text-[10px] text-mock-cobaltInk/70 tracking-widest uppercase block mb-2 line-clamp-1">
          {bundle.description}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] md:text-xs text-mock-sub group-hover:text-mock-cobalt transition-colors duration-300">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Click to Verify &amp; View →
        </span>
      </div>
    </Link>
  );
}

// Sits directly under CatalogTeaser on the homepage — same no-price,
// verification-gated preview pattern as the main catalog teaser (pricing
// stays behind /gate for every product, bundles included), just for the
// Research Bundles category instead of individual compounds.
export default function BundlesTeaser({ bundles }: { bundles: ProductCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  if (bundles.length === 0) return null;

  return (
    <section className="relative bg-mock-page pb-[76px]">
      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="w-6 h-px bg-mock-cobalt" />
          <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.25em] uppercase">
            Research Bundles
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
          <span>Multi-Compound Research Bundles</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mb-7"
        >
          <p className="font-mono text-[11px] text-mock-sub tracking-[0.2em] uppercase mb-3">
            Common compound pairings, bundled and discounted
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-left">
            {bundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="/catalog?category=Research+Bundles"
            className="inline-block px-7 py-3 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30"
          >
            Browse All Bundles →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
