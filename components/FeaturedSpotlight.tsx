"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

// Full-bleed graphite band pairing a single hero product shot with a short
// trust statement + stat row. Visual template is shared with the
// product-detail-page hero (see ProductPageTemplate.tsx) per the homepage
// integration brief.
export default function FeaturedSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-navy-950 overflow-hidden">
      <div ref={ref} className="grid lg:grid-cols-2 items-stretch">
        <div className="relative min-h-[320px] lg:min-h-[480px] bg-navy-950">
          <Image
            src="/images/homepage/glow-hero.png"
            alt="Anvil Compounds BPC-157 research vial, lot-verified and 99%+ purity"
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center gap-4 px-6 py-16 md:px-14 md:py-20"
        >
          <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
            A standard you can see
          </span>
          <h2
            className="font-display font-800 text-white leading-[1.05]"
            style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.8rem)" }}
          >
            Silver-sealed. Lot-verified. Research-grade.
          </h2>
          <p className="font-body text-white/50 text-base leading-relaxed max-w-md">
            Every vial ships with the same discipline behind it — a
            Certificate of Analysis covering purity, identity, and endotoxin
            screening for that exact lot. No batch skips a step.
          </p>
          <div className="flex gap-8 mt-2">
            <div>
              <span className="block font-display font-800 text-2xl text-white">99%+</span>
              <span className="font-mono text-[11px] text-white/40 tracking-wider uppercase">Minimum Purity</span>
            </div>
            <div>
              <span className="block font-display font-800 text-2xl text-white">6×</span>
              <span className="font-mono text-[11px] text-white/40 tracking-wider uppercase">Verification Methods</span>
            </div>
            <div>
              <span className="block font-display font-800 text-2xl text-white">COA</span>
              <span className="font-mono text-[11px] text-white/40 tracking-wider uppercase">Every Batch</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
