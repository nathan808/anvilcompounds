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

const features = [
  {
    title: "Independent Testing",
    description: "We contract certified third-party labs instead of testing in-house, so results can't be quietly adjusted to pass a batch.",
  },
  {
    title: "Same-Day Dispatch",
    description: "Orders placed before 12PM PST ship the same day via USPS Priority Mail. Tracking provided at fulfillment.",
  },
  {
    title: "COA on Every Batch",
    description: "A Certificate of Analysis documenting all three test results ships with every order. Full transparency, no exceptions.",
  },
  {
    title: "Same-Day Support",
    description: "Weekday email support with same-day response guarantee. Damage claim? We ship free replacements within 48 hours.",
  },
];

const stats = [
  { value: 99, suffix: "%+", label: "Minimum Purity Threshold" },
  { value: 6, suffix: "x", label: "Independent Verification Methods" },
  { value: 48, suffix: "hr", label: "Damage Replacement Guarantee Window" },
  { value: 0, suffix: "", label: "Same Day Support from Real Humans", display: "Same Day" },
];

export default function TrustSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="trust" className="relative bg-mock-graphite py-[76px] overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="max-w-2xl mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-3"
          >
            <div className="w-6 h-px bg-mock-cobaltLight" />
            <span className="font-mono text-xs text-mock-cobaltLight tracking-[0.25em] uppercase">
              004 / Why Anvil
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading font-700 text-[#EAF0FA] mb-4"
            style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.5rem)" }}
          >
            Built Around One
            <br />
            <span className="font-800 italic text-mock-cobaltLight">Standard</span>
          </motion.h2>

          <p className="font-body text-[#AEBBD0] text-base">
            Anyone can print 99% pure on a label. We built our pipeline so you never have to
            take our word for it.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 text-center"
            >
              <div className="font-display font-900 text-mock-cobaltLight mb-1" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.7rem)" }}>
                {"display" in stat ? stat.display : <CountUp end={stat.value} suffix={stat.suffix} />}
              </div>
              <div className="font-mono text-xs text-[#AEBBD0] tracking-wider uppercase leading-snug">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features grid — plain list, no icons, matching the mockup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <h4 className="font-display font-700 text-[#EAF0FA] text-[15px] mb-1.5">{feature.title}</h4>
              <p className="font-body text-[#AEBBD0] text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
