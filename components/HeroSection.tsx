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
      style={{
        height: "clamp(580px, 78vh, 820px)",
        background: "linear-gradient(135deg, #f0f5ff 0%, #f5f8ff 50%, #f8faff 100%)",
      }}
    >
      {/* Product lineup — right side, contained so nothing is cropped */}
      <div className="absolute right-0 inset-y-0 w-[52%] hidden md:flex items-center pointer-events-none">
        <div className="relative w-full h-full">
          <Image
            src="/images/productcard4-cropped.png"
            alt="Anvil Compounds research compounds"
            fill
            quality={100}
            className="object-contain"
            priority
            sizes="52vw"
          />
          {/* Blend all 4 edges into the hero background */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(to right, #f5f8ff 0%, rgba(245,248,255,0) 25%),
                linear-gradient(to left, #f5f8ff 0%, rgba(245,248,255,0) 10%),
                linear-gradient(to bottom, #f5f8ff 0%, rgba(245,248,255,0) 10%),
                linear-gradient(to top, #f5f8ff 0%, #f5f8ff 5%, rgba(245,248,255,0) 16%)
              `,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 md:pt-20 pb-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-[480px] lg:max-w-[520px]">

            {/* Badge */}
            <motion.div variants={item} className="flex items-center gap-3 mb-4 mt-[10px]">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-300/60 bg-white/60 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-[10px] md:text-xs font-mono text-blue-700 tracking-widest uppercase">
                  Research Grade · 99%+ Purity
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="font-display font-800 leading-[0.92] mb-4"
              style={{ fontSize: "clamp(2.2rem, 4.8vw, 4.5rem)" }}
            >
              <span className="block text-gray-900">Independently</span>
              <span className="block text-gray-900">Verified.</span>
              <span className="block text-blue-700 md:text-[#4D94F0]">Every Batch.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={item}
              className="font-body text-gray-600 text-sm md:text-base leading-relaxed mb-6"
            >
              Research-grade compounds independently verified through triple-method
              testing. Every batch. No exceptions.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={item} className="flex flex-wrap gap-3 mb-3">
              <a
                href="#catalog"
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
              >
                Explore Catalog
              </a>
              <a
                href="#testing"
                className="px-7 py-3.5 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/50 hover:bg-white/80"
              >
                Our Testing Process →
              </a>
            </motion.div>

            {/* Shipping banner */}
            <motion.div variants={item} className="mb-6 max-w-[480px]">
              <ShippingBanner theme="light" />
            </motion.div>

            {/* Stats row */}
            <motion.div variants={item} className="flex flex-wrap gap-8 md:gap-12">
              {[
                { value: "99%+", label: "Minimum Purity" },
                { value: "3×", label: "Verification Methods" },
                { value: "Same Day", label: "Dispatch by 12PM PST" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="font-display font-800 text-2xl md:text-3xl text-blue-700 md:text-blue-600">
                    {stat.value}
                  </span>
                  <span className="font-mono text-[9px] md:text-xs text-gray-500 tracking-widest uppercase">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>

          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-gradient-to-b from-gray-300 to-transparent"
        />
      </motion.div>
    </section>
  );
}
