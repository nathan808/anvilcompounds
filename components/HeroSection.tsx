"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 4,
  duration: Math.random() * 6 + 4,
}));

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden mesh-bg"
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(29,106,219,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.07) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-blue-400"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] bg-blue-600 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-8 blur-[100px] bg-blue-800 pointer-events-none" />

      {/* Content */}
      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl"
          >
            {/* Badge */}
            <motion.div variants={item} className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-600/30 bg-blue-600/10">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-ring inline-block" />
                <span className="text-xs font-mono text-blue-300 tracking-widest uppercase">
                  Research Grade · 99%+ Purity
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="font-display font-800 leading-[0.92] mb-6"
              style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)" }}
            >
              <span className="block text-white">Purity</span>
              <span className="block text-white">Proven.</span>
              <span className="block glow-text" style={{ color: "#4D94F0" }}>
                Not Promised.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={item}
              className="font-body text-white/50 text-lg md:text-xl max-w-xl leading-relaxed mb-10"
            >
              Research-grade compounds independently verified through triple-method
              testing. Every batch. No exceptions.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={item} className="flex flex-wrap gap-4 mb-16">
              <a
                href="#catalog"
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/40 overflow-hidden"
              >
                <span className="relative z-10">Explore Catalog</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="#testing"
                className="px-8 py-4 border border-white/20 hover:border-blue-400/50 text-white/70 hover:text-white font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 hover:bg-white/5"
              >
                Our Testing Process →
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={item} className="flex flex-wrap gap-8 md:gap-12">
              {[
                { value: "99%+", label: "Minimum Purity" },
                { value: "3×", label: "Verification Methods" },
                { value: "Same Day", label: "Dispatch by 12PM PST" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="font-display font-800 text-2xl md:text-3xl text-blue-400">
                    {stat.value}
                  </span>
                  <span className="font-mono text-xs text-white/40 tracking-widest uppercase">
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs font-mono text-white/25 tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-gradient-to-b from-blue-400/50 to-transparent"
        />
      </motion.div>
    </section>
  );
}
