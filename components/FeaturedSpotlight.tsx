"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

// Split band pairing a single hero product shot with a short trust
// statement + stat row. Image and section share the same light "ice"
// background so the vial composite (which already has its own light
// background baked in) sits seamlessly rather than looking framed.
export default function FeaturedSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-ice overflow-hidden">
      <div ref={ref} className="grid lg:grid-cols-2 items-stretch">
        <div className="relative w-full bg-ice flex items-center justify-center p-6 lg:p-8">
          <div className="relative w-full max-w-[80%] aspect-[896/1200]">
            <Image
              src="/images/homepage/glow-hero-light.png"
              alt="Anvil Compounds BPC-157 research vial, lot-verified and 99%+ purity"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 80vw, 40vw"
              loading="lazy"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center gap-3 px-6 py-12 md:px-12 md:py-16"
        >
          <span className="font-mono text-xs text-blue-600 tracking-[0.25em] uppercase">
            A standard you can see
          </span>
          <h2
            className="font-display font-800 text-navy-900 leading-[1.05]"
            style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.5rem)" }}
          >
            Silver-sealed. Lot-verified. Research-grade.
          </h2>
          <p className="font-body text-navy-900/55 text-base leading-relaxed max-w-md">
            Every vial ships with the same discipline behind it: a
            Certificate of Analysis covering purity, identity, and endotoxin
            screening for that exact lot. No batch skips a step.
          </p>
          <div className="flex gap-7 mt-1">
            <div>
              <span className="block font-display font-800 text-xl text-navy-900">99%+</span>
              <span className="font-mono text-[10px] text-navy-900/40 tracking-wider uppercase">Minimum Purity</span>
            </div>
            <div>
              <span className="block font-display font-800 text-xl text-navy-900">6×</span>
              <span className="font-mono text-[10px] text-navy-900/40 tracking-wider uppercase">Verification Methods</span>
            </div>
            <div>
              <span className="block font-display font-800 text-xl text-navy-900">COA</span>
              <span className="font-mono text-[10px] text-navy-900/40 tracking-wider uppercase">Every Batch</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
