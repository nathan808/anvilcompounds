"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Data ────────────────────────────────────────────────────────────────────

const standardCards = [
  {
    title: "Independent Verification",
    body: "Every lot is tested by an accredited third-party laboratory — not in-house. COA results link directly to the lab's public database, verifiable by anyone before or after purchase.",
  },
  {
    title: "Three-Method Testing",
    body: "Identity confirmation via mass spectrometry. Purity quantification via HPLC. Safety screening via LAL endotoxin assay. All three required. No lot ships on a single method alone.",
  },
  {
    title: "Zero Tolerance Threshold",
    body: "Any lot testing below 98% purity, failing mass spec identity, or returning elevated endotoxin levels is rejected in full. Failed batches are not discounted, relabeled, or sold through alternative channels.",
  },
];

const operationalRows = [
  {
    title: "Same-Day Fulfillment",
    body: "Orders placed before 12PM PST ship the same business day via USPS Priority Mail. Tracking is provided at dispatch. No batch delays, no backorder queuing.",
  },
  {
    title: "Lot Traceability",
    body: "Every vial is traceable to its manufacturing lot. COA documentation is maintained per-lot and published on the product page. Lot IDs are printed on each vial.",
  },
  {
    title: "Lyophilized Format",
    body: "All compounds are supplied as lyophilized powder in sealed glass vials. Lyophilization maximizes compound stability across ambient-temperature shipping conditions without cold-chain dependency.",
  },
  {
    title: "Compound Integrity",
    body: "No undisclosed excipients. No fillers. No reconstituted liquid compounds. What the label states is what the COA confirms.",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StandardCard({
  title,
  body,
  index,
}: {
  title: string;
  body: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-7 flex flex-col gap-4 hover:border-blue-500/30 transition-all duration-500 group"
    >
      <div className="w-8 h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full group-hover:w-12 transition-all duration-500" />
      <h3 className="font-display font-700 text-white text-xl">{title}</h3>
      <p className="font-body text-white/45 text-sm leading-relaxed">{body}</p>
    </motion.div>
  );
}

function OperationalRow({
  title,
  body,
  index,
}: {
  title: string;
  body: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.75, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col md:flex-row gap-8 md:gap-16 items-stretch ${
        isEven ? "" : "md:flex-row-reverse"
      }`}
    >
      {/* Text side */}
      <div className="flex-1 flex flex-col justify-center py-4">
        <span className="font-mono text-xs text-blue-400/60 tracking-[0.2em] uppercase mb-3">
          0{index + 1}
        </span>
        <h3 className="font-display font-700 text-white text-2xl md:text-3xl mb-4">{title}</h3>
        <p className="font-body text-white/45 text-base leading-relaxed max-w-md">{body}</p>
      </div>

      {/* Glass card accent side */}
      <div className="flex-1">
        <div className="glass-card rounded-2xl h-full min-h-[140px] flex items-center justify-center p-8 relative overflow-hidden group">
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(29,106,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Glow orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-600/10 blur-2xl group-hover:bg-blue-600/20 transition-all duration-700" />
          {/* Index label */}
          <span
            className="relative font-display font-800 text-blue-600/20 select-none leading-none"
            style={{ fontSize: "clamp(4rem, 10vw, 7rem)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <main className="bg-navy-950 min-h-screen">
      <Navbar />

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section className="relative mesh-bg pt-40 pb-28 md:pt-52 md:pb-36 overflow-hidden">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(29,106,219,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.06) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Blue glow */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] rounded-full opacity-15 blur-[120px] bg-blue-600 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-400 tracking-[0.3em] uppercase">
              About Anvil Compounds
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-800 text-white leading-[1.08] mb-8"
            style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.2rem)" }}
          >
            Built for researchers who need to know{" "}
            <span className="text-blue-400">exactly what's in the vial.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-body text-white/45 text-lg leading-relaxed max-w-3xl"
          >
            Anvil Compounds operates as a research-grade peptide supplier with one non-negotiable
            standard: every compound shipped is independently verified before it leaves the facility.
          </motion.p>
        </div>
      </section>

      {/* ── 2. The Standard ──────────────────────────────────────────────── */}
      <section className="bg-navy-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp className="mb-14">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
                The Standard
              </span>
            </div>
            <h2
              className="font-display font-800 text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Non-negotiables,{" "}
              <span className="text-blue-400">not talking points.</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {standardCards.map((card, i) => (
              <StandardCard key={card.title} title={card.title} body={card.body} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Operational Discipline ────────────────────────────────────── */}
      <section className="bg-navy-950 py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-8 blur-[120px] bg-blue-700 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <FadeUp className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
                Operational Discipline
              </span>
            </div>
            <h2
              className="font-display font-800 text-white max-w-xl"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Systems that hold,{" "}
              <span className="text-blue-400">not promises that don't.</span>
            </h2>
          </FadeUp>

          <div className="space-y-14 md:space-y-20">
            {operationalRows.map((row, i) => (
              <OperationalRow key={row.title} title={row.title} body={row.body} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Research Use Statement ─────────────────────────────────────── */}
      <section className="bg-navy-900 py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <FadeUp>
            <div className="glass-card rounded-2xl p-10 md:p-14 relative overflow-hidden">
              {/* Warning accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />

              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0 w-8 h-8 rounded-full border border-yellow-500/50 flex items-center justify-center mt-0.5">
                  <span className="text-yellow-400 text-sm font-bold">!</span>
                </div>
                <h2 className="font-display font-700 text-white text-2xl md:text-3xl">
                  Research Use Only
                </h2>
              </div>

              <p className="font-body text-white/45 text-base leading-relaxed">
                All compounds sold by Anvil Compounds are intended exclusively for in vitro
                laboratory research. They are not approved for human or veterinary use, are not
                pharmaceutical-grade drug products, and are not sold for diagnostic, therapeutic, or
                household applications. Purchasers must be 21 years of age or older and must confirm
                research intent at checkout. Anvil Compounds is not a pharmacy, compounding
                facility, or clinical supplier.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── 5. Contact ───────────────────────────────────────────────────── */}
      <section className="bg-navy-950 py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <FadeUp>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
                Get in Touch
              </span>
              <div className="w-6 h-px bg-blue-600" />
            </div>
            <p className="font-body text-white/50 text-base mb-8 leading-relaxed">
              For order inquiries, research questions, or institutional purchasing:
            </p>
            <a
              href="mailto:support@anvilcompounds.shop"
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-display font-600 text-base rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30 group"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
              </svg>
              support@anvilcompounds.shop
            </a>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  );
}
