"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import ShippingBanner from "@/components/ShippingBanner";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex items-center overflow-hidden"
      style={{ minHeight: "clamp(430px, 58vh, 660px)" }}
    >
      {/* Light background */}
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

      {/* Content */}
      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 md:px-10 pt-12 pb-12 md:pt-16 md:pb-16">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 lg:gap-8 items-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center text-center lg:items-start lg:text-left px-2 py-3 md:py-5"
            style={{ background: "radial-gradient(ellipse 70% 85% at 50% 48%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 60%, transparent 100%)" }}
          >

            {/* Badge — hidden on mobile to make room for the vial graphic below the text */}
            <motion.div variants={item} className="hidden md:flex items-center justify-center lg:justify-start mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-mock-line bg-white/70 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-mock-cobalt inline-block flex-shrink-0" />
                <span className="text-[10px] md:text-xs font-mono text-mock-cobaltInk tracking-widest uppercase">
                  Research Grade · 99%+ Purity<span className="hidden sm:inline"> · USA-Based</span>
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="font-heading font-700 leading-[0.95] mb-3 max-w-3xl"
              style={{ fontSize: "clamp(1.98rem, 4.5vw, 4rem)", textShadow: "0 1px 12px rgba(255,255,255,0.95), 0 0px 2px rgba(255,255,255,0.7)" }}
            >
              <span className="block text-mock-ink">Research Peptides with</span>
              <span className="block">
                <span className="font-800 italic text-mock-cobalt">Conviction</span>{" "}
                <span className="text-mock-ink">and</span>{" "}
                <span className="font-800 italic text-mock-cobalt">Verification</span>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={item}
              className="font-body text-mock-sub text-sm md:text-base leading-relaxed mb-1 max-w-sm md:max-w-md"
            >
              &gt;99%+ purity threshold. Independently Verified + Scannable COAs per vial.
            </motion.p>
            <motion.p
              variants={item}
              className="font-body text-mock-sub text-xs md:text-sm leading-relaxed mb-4 max-w-sm md:max-w-md"
            >
              Southern California USA Based Facility
            </motion.p>

            {/* CTAs — stacked on mobile, row on sm+ */}
            <motion.div variants={item} className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-2.5 mb-3 w-full sm:w-auto">
              <a
                href="/catalog?catalog=full"
                className="px-6 py-2.5 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30 text-center"
              >
                Explore Catalog
              </a>
              <a
                href="/coas"
                className="px-6 py-2.5 border border-mock-line hover:border-mock-cobalt text-mock-cobaltInk hover:text-mock-cobalt font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/60 hover:bg-white/90 text-center"
              >
                View COAs →
              </a>
              <a
                href="#testing"
                className="px-6 py-2.5 border border-mock-line hover:border-mock-sub text-mock-sub hover:text-mock-ink font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/60 hover:bg-white/90 text-center"
              >
                Our Testing Process →
              </a>
            </motion.div>

            {/* Vial graphic — mobile/tablet only; sits below the main text, using the space
                freed up by hiding the shipping banner on this breakpoint. Desktop shows the
                vial in the side column instead (see below) and keeps the shipping banner. */}
            <motion.div variants={item} className="lg:hidden relative w-[320px] max-w-[82vw] aspect-square mb-3">
              <Image
                src="/images/homepage/hero-vial-callouts.png"
                alt="Anvil Compounds BPC-157 research vial with 99%+ purity, lot-verified, and USA-based facility callouts"
                fill
                className="object-contain"
                sizes="320px"
              />
            </motion.div>

            {/* Shipping banner — desktop only now; hidden on mobile to make room for the larger vial graphic above */}
            <motion.div variants={item} className="hidden lg:block mb-3 w-full max-w-sm md:max-w-md">
              <ShippingBanner theme="light" />
            </motion.div>

            {/* RUO disclaimer */}
            <motion.p variants={item} className="font-mono text-[9px] md:text-[10px] text-mock-sub tracking-wide max-w-xs md:max-w-sm text-center lg:text-left">
              For in vitro laboratory &amp; research use only. Not for human or animal use. 21+ only.
            </motion.p>

          </motion.div>

          {/* Vial graphic — desktop side column, proportional to the text block, never overlapping it */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-[528px] aspect-square">
              <Image
                src="/images/homepage/hero-vial-callouts.png"
                alt="Anvil Compounds BPC-157 research vial with 99%+ purity, lot-verified, and USA-based facility callouts"
                fill
                className="object-contain"
                sizes="528px"
                priority
              />
            </div>
          </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-[10px] font-mono text-mock-sub tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-mock-line to-transparent"
        />
      </motion.div>
    </section>
  );
}
