"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { CATALOG_TRUST_BADGES } from "@/components/ProductsSection";

// Replaces the inline product grid on the homepage — the real catalog (with
// actual product names/prices) now lives on /catalog, which sits behind the
// verification gate (see middleware.ts). This teaser is pure marketing copy,
// so it's deliberately left off the gate and stays indexable.
export default function CatalogTeaser() {
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
