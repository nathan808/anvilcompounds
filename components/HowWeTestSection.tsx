"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const methods = [
  {
    step: "01",
    name: "HPLC",
    fullName: "High-Performance Liquid Chromatography",
    role: "Purity Quantification",
    description:
      "Each compound is separated through a stationary phase under pressure, producing a chromatogram that precisely quantifies the percentage of active compound versus impurities. We require 99%+ purity — no batch ships below this threshold.",
    detail: "Detects impurities at parts-per-million sensitivity",
    color: "from-blue-600 to-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    step: "02",
    name: "Mass Spec",
    fullName: "Mass Spectrometry",
    role: "Molecular Identity Confirmation",
    description:
      "Ionization and mass-to-charge analysis confirms the exact molecular identity of each compound. This is not self-reporting — it's chemical proof. We verify you're getting exactly what the label says at the molecular level.",
    detail: "Confirms molecular weight and structural identity",
    color: "from-cyan-600 to-cyan-400",
    dotColor: "bg-cyan-500",
  },
  {
    step: "03",
    name: "Endotoxin Screen",
    fullName: "Endotoxin (LAL) Screening",
    role: "Bacterial Contamination Detection",
    description:
      "Using the Limulus Amebocyte Lysate assay, we screen every batch for bacterial endotoxins — a step most vendors in this space skip entirely. Endotoxin contamination is invisible and odorless, making this test non-negotiable.",
    detail: "Non-standard in this industry — we do it anyway",
    color: "from-indigo-600 to-indigo-400",
    dotColor: "bg-indigo-500",
  },
];

export default function HowWeTestSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="testing" className="relative bg-navy-900 py-24 md:py-36 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-8 blur-[100px] bg-blue-700 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(29,106,219,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="max-w-2xl mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
              003 / Verification Protocol
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-800 text-white mb-5"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
          >
            Triple-Method
            <br />
            <span className="text-blue-400">Testing Protocol</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-white/45 text-lg leading-relaxed"
          >
            Most vendors test once, or not at all. We run three independent
            verification methods on every batch before it reaches your lab.
          </motion.p>
        </div>

        {/* Methods */}
        <div className="space-y-6">
          {methods.map((method, i) => (
            <MethodRow key={method.step} method={method} index={i} />
          ))}
        </div>

        {/* COA callout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 p-6 md:p-8 rounded-xl border border-blue-600/20 bg-blue-600/5 flex flex-col md:flex-row gap-6 md:items-center"
        >
          <div className="flex-grow">
            <h3 className="font-display font-700 text-white text-xl mb-2">
              Certificate of Analysis — Every Batch
            </h3>
            <p className="font-body text-white/45 text-sm leading-relaxed max-w-lg">
              Every order ships with a full COA summarizing all three test results. Scan the
              QR code to verify your batch on our independent testing portal.
            </p>
          </div>
          <div className="shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl border-2 border-blue-600/30 bg-navy-800 flex items-center justify-center float">
              <div className="grid grid-cols-3 gap-1.5 p-3">
                {Array.from({ length: 9 }).map((_, k) => (
                  <div
                    key={k}
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: [0, 2, 6, 8].includes(k)
                        ? "#1D6ADB"
                        : Math.random() > 0.5
                        ? "#0D1F3C"
                        : "#4D94F0",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MethodRow({ method, index }: { method: typeof methods[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="group relative glass-card rounded-xl p-6 md:p-8 hover:border-blue-500/30 transition-all duration-500 hover:-translate-x-1"
    >
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 md:items-start">
        {/* Step number */}
        <div className="shrink-0 flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center`}
          >
            <span className="font-mono font-500 text-white text-sm">{method.step}</span>
          </div>
          <div className="md:hidden">
            <span className="font-display font-800 text-xl text-white">{method.name}</span>
            <span className="block font-mono text-xs text-blue-400/70 tracking-wider uppercase mt-0.5">
              {method.role}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow">
          <div className="hidden md:block mb-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-display font-800 text-2xl text-white">{method.name}</span>
              <span className="font-mono text-xs text-white/35 tracking-wider">{method.fullName}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${method.dotColor}`} />
              <span className="font-mono text-xs text-blue-400 tracking-wider uppercase">
                {method.role}
              </span>
            </div>
          </div>
          <p className="font-body text-white/50 text-sm md:text-base leading-relaxed mb-3">
            {method.description}
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${method.dotColor}`} />
            <span className="font-mono text-xs text-blue-300/60 italic">{method.detail}</span>
          </div>
        </div>
      </div>

      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-8 bottom-8 w-0.5 rounded-full bg-gradient-to-b ${method.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
    </motion.div>
  );
}
