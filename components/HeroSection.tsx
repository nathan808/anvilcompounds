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

const TESTING_METHODS = [
  {
    abbr: "HPLC",
    result: "99%+ Purity",
    desc: "Quantifies active compound vs. impurities at ppm sensitivity.",
  },
  {
    abbr: "Mass Spec",
    result: "Molecular ID",
    desc: "Chemical proof of exact molecular weight and structural identity.",
  },
  {
    abbr: "LAL Screen",
    result: "Contamination-Free",
    desc: "Endotoxin screening every batch, a step most vendors skip.",
  },
];

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex items-center overflow-hidden"
      style={{ minHeight: "clamp(480px, 66vh, 740px)" }}
    >
      {/* Background — responsive banner (desktop/mobile crops) */}
      <Image
        src="/images/homepage/banner-desktop.jpg"
        alt="Anvil Compounds research vials arranged in a laboratory"
        fill
        className="hidden md:block object-cover object-right"
        priority
        sizes="100vw"
        quality={90}
      />
      <Image
        src="/images/homepage/banner-mobile.jpg"
        alt="Anvil Compounds research vials arranged in a laboratory"
        fill
        className="block md:hidden object-cover object-bottom"
        priority
        sizes="100vw"
        quality={90}
      />
      {/* Scrim — opaque near the text (left/top), fading away before it
          reaches the vials, so the photo reads clearly instead of being
          uniformly dulled. Direction flips to top-down on mobile, matching
          the stacked layout. */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{ background: "linear-gradient(90deg, #EEF4FF 24%, rgba(238,244,255,0.86) 40%, rgba(238,244,255,0) 62%)" }}
      />
      <div
        className="absolute inset-0 block md:hidden"
        style={{ background: "linear-gradient(180deg, #EEF4FF 40%, rgba(238,244,255,0.88) 52%, rgba(238,244,255,0) 68%)" }}
      />

      {/* Content — left-aligned, capped narrow so it never reaches the vials */}
      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-16 pb-16 md:pt-20 md:pb-20">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start text-left max-w-[420px] md:max-w-[480px]"
          >

            {/* Badge */}
            <motion.div variants={item} className="flex items-center mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-300/60 bg-white/70 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block flex-shrink-0" />
                <span className="text-[10px] md:text-xs font-mono text-blue-700 tracking-widest uppercase">
                  Research Grade · 99%+ Purity<span className="hidden sm:inline"> · USA-Based</span>
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="font-display font-800 leading-[0.95] mb-4"
              style={{ fontSize: "clamp(2rem, 4.6vw, 3.75rem)" }}
            >
              <span className="block font-500 text-gray-700">Research with</span>
              <span className="block" style={{ color: "#1D6ADB" }}>Conviction</span>
              <span className="block text-gray-950">and Verification</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={item}
              className="font-body text-gray-700 text-sm md:text-base leading-relaxed mb-5"
            >
              Independently verified through multi-vial hexa-method testing
              per lot: Purity, Identity, Endotoxin and Heavy-Metal Screening.
              Research compounds and reference materials vetted with high
              standards and resilience.
            </motion.p>

            {/* CTAs — stacked on mobile, row on sm+ */}
            <motion.div variants={item} className="flex flex-col sm:flex-row flex-wrap justify-start gap-2.5 mb-4 w-full sm:w-auto">
              <a
                href="/catalog?catalog=full"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 text-center"
              >
                Explore Catalog
              </a>
              <a
                href="/coas"
                className="px-6 py-3 border border-blue-300 hover:border-blue-400 text-blue-700 hover:text-blue-600 font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/60 hover:bg-white/90 text-center"
              >
                View COAs →
              </a>
              <a
                href="#testing"
                className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/60 hover:bg-white/90 text-center"
              >
                Our Testing Process →
              </a>
            </motion.div>

            {/* Shipping banner */}
            <motion.div variants={item} className="mb-4 w-full">
              <ShippingBanner theme="light" />
            </motion.div>

            {/* RUO disclaimer */}
            <motion.p variants={item} className="font-mono text-[9px] md:text-[10px] text-gray-400 tracking-wide">
              For in vitro laboratory &amp; research use only. Not for human or animal use. 21+ only.
            </motion.p>

          </motion.div>
        </div>
      </motion.div>

      {/* Testing methods strip — navy, pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-navy-950/90 backdrop-blur-md border-t border-blue-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-3 md:py-4">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {TESTING_METHODS.map((m) => (
              <div key={m.abbr} className="px-3 sm:px-4 first:pl-0 last:pr-0 flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-mono text-[9px] sm:text-[10px] md:text-xs text-blue-400 font-600 tracking-widest uppercase whitespace-nowrap">
                    {m.abbr}
                  </span>
                  <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] text-white/50 tracking-wide whitespace-nowrap hidden xs:block sm:block">
                    {m.result}
                  </span>
                </div>
                <p className="font-mono text-[9px] md:text-[10px] text-white/60 leading-snug hidden md:block">
                  {m.desc}
                </p>
                <span className="font-mono text-[8px] text-white/50 tracking-wide block sm:hidden">
                  {m.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-gray-300 to-transparent"
        />
      </motion.div>
    </section>
  );
}
