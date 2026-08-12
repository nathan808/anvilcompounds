"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import LoopVideo from "@/components/LoopVideo";

// Split band pairing a single hero product shot with a short trust
// statement + stat row. Dark graphite section matching the approved mockup.
export default function FeaturedSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative overflow-hidden bg-mock-graphite">
      <div ref={ref} className="grid lg:grid-cols-2 items-stretch">
        {/* Framed card — object-cover crops the horizontal source video to
            fill this square frame (sides trimmed, nothing off the top/bottom
            where the vial sits). */}
        <div className="relative w-full min-h-[400px] sm:min-h-[480px] lg:min-h-[520px] flex items-center justify-center p-8 md:p-10 lg:p-11">
          <div className="relative w-full aspect-square max-w-[560px] lg:max-w-[480px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30 bg-white/[0.03]">
            <LoopVideo
              src="/videos/anvil-semax-selank-loop.mp4"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center gap-3 px-6 py-8 md:px-12 md:py-10 lg:px-10 lg:py-8"
        >
          <span className="font-mono text-xs text-mock-cobaltLight tracking-[0.25em] uppercase">
            A standard you can see
          </span>
          <h2
            className="font-heading font-700 text-[#EAF0FA] leading-[1.05]"
            style={{ fontSize: "clamp(1.5rem, 2.8vw, 1.85rem)" }}
          >
            Silver-sealed. Lot-verified.{" "}
            <span className="font-800 italic text-mock-cobaltLight">Research-grade.</span>
          </h2>
          <p className="font-body text-[#AEBBD0] text-sm leading-relaxed max-w-md">
            Every vial ships with the same discipline behind it: a
            Certificate of Analysis covering purity, identity, and endotoxin
            screening for that exact lot. No batch skips a step.
          </p>
          <div className="flex gap-6 mt-1">
            <div>
              <span className="block font-heading italic font-800 text-mock-cobaltLight" style={{ fontSize: "1.2rem" }}>99%+</span>
              <span className="font-heading italic text-mock-cobaltLight tracking-wider uppercase" style={{ fontSize: "11px" }}>Minimum Purity</span>
            </div>
            <div>
              <span className="block font-heading italic font-800 text-mock-cobaltLight" style={{ fontSize: "1.2rem" }}>6×</span>
              <span className="font-heading italic text-mock-cobaltLight tracking-wider uppercase" style={{ fontSize: "11px" }}>Verification Methods</span>
            </div>
            <div>
              <span className="block font-heading italic font-800 text-mock-cobaltLight" style={{ fontSize: "1.2rem" }}>COA</span>
              <span className="font-heading italic text-mock-cobaltLight tracking-wider uppercase" style={{ fontSize: "11px" }}>Every Batch</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
