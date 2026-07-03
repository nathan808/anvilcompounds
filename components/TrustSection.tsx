"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

function CountUp({ end, suffix = "", decimals = 0 }: { end: number; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(parseFloat(current.toFixed(decimals)));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, end, decimals]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}
      {suffix}
    </span>
  );
}

const trustPillars = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: "Independent Testing",
    description: "We use certified third-party labs — not in-house testing. Results can't be manipulated to pass a batch.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: "Same-Day Dispatch",
    description: "Orders placed before 12PM PST ship the same day via USPS Priority Mail. Tracking provided at fulfillment.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "COA on Every Batch",
    description: "A Certificate of Analysis documenting all three test results ships with every order. Full transparency, no exceptions.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: "Same-Day Support",
    description: "Weekday email support with same-day response guarantee. Damage claim? We ship free replacements within 48 hours.",
  },
];

const stats = [
  { value: 99, suffix: "%+", label: "Minimum Purity Threshold" },
  { value: 6, suffix: "x", label: "Independent Verification Methods" },
  { value: 48, suffix: "hr", label: "Damage Replacement Garuntee Window" },
  { value: 0, suffix: "", label: "Same Day Support from Real Humans", display: "Same Day" },
];

export default function TrustSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="trust" className="relative bg-ice py-24 md:py-36 overflow-hidden">
      {/* Subtle blue gradient on light bg */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-white via-ice to-blue-50 opacity-80" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="max-w-2xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-600 tracking-[0.25em] uppercase">
              004 / Why Anvil
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-800 text-navy-900 mb-5"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
          >
            Built Around One
            <br />
            <span className="text-blue-600">Standard</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-navy-900/55 text-lg leading-relaxed"
          >
            In a market where claims are easy and proof is rare, we made
            verification the default — not an upgrade.
          </motion.p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass-card-light rounded-xl p-5 md:p-6 text-center"
            >
              <div className="font-display font-800 text-navy-900 mb-1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                {"display" in stat ? stat.display : <CountUp end={stat.value} suffix={stat.suffix} />}
              </div>
              <div className="font-mono text-xs text-navy-900/40 tracking-wider uppercase leading-snug">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trustPillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="glass-card-light rounded-xl p-6 flex gap-5"
            >
              <div className="shrink-0 w-11 h-11 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
                {pillar.icon}
              </div>
              <div>
                <h3 className="font-display font-700 text-navy-900 text-lg mb-2">{pillar.title}</h3>
                <p className="font-body text-navy-900/55 text-sm leading-relaxed">{pillar.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SoCal callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col md:flex-row gap-4 md:items-center justify-between p-6 md:p-8 bg-navy-900 rounded-xl"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 pulse-ring" />
              <span className="font-mono text-xs text-blue-400 tracking-widest uppercase">Southern California</span>
            </div>
            <h3 className="font-display font-700 text-white text-xl">
              Domestic. Reliable. Accountable.
            </h3>
            <p className="font-body text-white/40 text-sm mt-1">
              All orders ship from our SoCal facility. USPS Priority — 2 to 5 business days.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-lg border border-blue-600/20 bg-blue-600/10">
              <span className="font-mono text-xs text-blue-300 tracking-wider">USPS Priority</span>
            </div>
            <div className="px-4 py-2.5 rounded-lg border border-blue-600/20 bg-blue-600/10">
              <span className="font-mono text-xs text-blue-300 tracking-wider">2-5 Day Delivery</span>
            </div>
            <div className="px-4 py-2.5 rounded-lg border border-blue-600/20 bg-blue-600/10">
              <span className="font-mono text-xs text-blue-300 tracking-wider">Order Tracking</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
