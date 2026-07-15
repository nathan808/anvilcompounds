"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Data ────────────────────────────────────────────────────────────────────

type FaqItem = { q: string; a: string };

const faqs: { category: string; items: FaqItem[] }[] = [
  {
    category: "Ordering & Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Card payments via Stripe (Visa, Mastercard, Amex, Discover, Apple Pay, Google Pay, Link) are coming soon and not yet live. Today, orders are reserved through the checkout flow and fulfilled after payment is received via one of: Ethereum or E-check (both via our payment partner Bankful, each with an instant 10% discount), Zelle to our business account, USDC/USDT cryptocurrency, or ACH bank transfer. Payment instructions are shown on the payment page and included in your confirmation email. Orders are held for 72 hours pending payment — after which they are released if no payment is received.",
      },
      {
        q: "How long is my order held after checkout?",
        a: "Reserved orders are held for 72 hours from the time of checkout. If payment is not received within that window, the order is released and inventory is returned to stock. To avoid delays, complete payment as soon as you receive your confirmation email.",
      },
      {
        q: "Can I cancel or modify my order?",
        a: "Orders can be cancelled or modified before payment is confirmed. Once payment clears and fulfillment begins, changes cannot be made. Contact support@anvilcompounds.shop immediately if you need to make adjustments.",
      },
      {
        q: "Do you require an account to order?",
        a: "No account is required to place an order. Guest checkout is available. Creating an account allows you to view order history and track fulfillment status.",
      },
    ],
  },
  {
    category: "Shipping",
    items: [
      {
        q: "How fast do orders ship?",
        a: "Orders placed before 12PM PST on business days ship the same day via USPS Priority Mail. Orders placed after 12PM PST ship the following business day. Tracking is provided at dispatch.",
      },
      {
        q: "Do you ship internationally?",
        a: "Anvil Compounds currently ships within the United States only. International shipping involves regulatory complexity that varies by jurisdiction — we do not ship to addresses outside the US at this time.",
      },
      {
        q: "How are compounds packaged?",
        a: "All compounds ship in sealed glass vials inside plain outer packaging. No product names, brand identifiers, or compound names appear on the exterior. Lyophilized compounds are stable at ambient temperature during transit and do not require cold-chain shipping.",
      },
      {
        q: "What if my package is damaged in transit?",
        a: "Contact support@anvilcompounds.shop with your order number and photos of the damage within 48 hours of delivery. We will arrange a replacement shipment for verified transit damage.",
      },
    ],
  },
  {
    category: "Quality & Testing",
    items: [
      {
        q: "Can I verify my COA independently?",
        a: "Yes — that's the entire point. Every product page links to the current lot's verification page hosted by the issuing laboratory. You can verify any certificate before purchase, after delivery, or at any time. The verification link opens the lab's public database entry for that specific lot — confirming results were not self-reported by Anvil Compounds.",
      },
      {
        q: "What happens if a batch fails testing?",
        a: "Failed batches don't ship. If a lot tests below our 98% purity threshold, fails mass spectrometry identity confirmation, or shows elevated endotoxin levels, the entire lot is rejected. We don't sell what we wouldn't ship to ourselves. Failed lots are not discounted, relabeled, or sold through secondary channels.",
      },
      {
        q: "What testing methods do you use?",
        a: "Every lot undergoes three independent tests: HPLC (high-performance liquid chromatography) for purity quantification, mass spectrometry for molecular identity confirmation, and LAL (limulus amebocyte lysate) assay for endotoxin screening. All three must pass before a lot is released for sale.",
      },
      {
        q: "How do I read a COA?",
        a: "A Certificate of Analysis (COA) documents the results of laboratory testing for a specific lot. Key fields: Purity (HPLC) — should read 98% or higher. Identity (MS) — confirms the compound matches its expected molecular weight. Endotoxin — should read below threshold (typically ≤1 EU/mg). Lot ID — matches the ID printed on your vial. Analysis Date — confirms the test was recent.",
      },
    ],
  },
  {
    category: "Research Use",
    items: [
      {
        q: 'What does "research use only" mean?',
        a: "Research Use Only (RUO) is a regulatory designation indicating that a product is intended exclusively for laboratory and scientific research. RUO products are not approved for human consumption, veterinary use, or clinical application. They are not pharmaceutical-grade drugs. Purchasing RUO compounds carries an implicit and explicit obligation to use them solely for in vitro research purposes.",
      },
      {
        q: "Can these compounds be used by humans?",
        a: "No. All Anvil Compounds products are sold strictly for in vitro laboratory research. They are not approved for human or veterinary use by any regulatory authority. Using research peptides in humans carries serious and unpredictable health risks. By completing an order, purchasers confirm they are acquiring compounds for legitimate research purposes only.",
      },
      {
        q: "How do I reconstitute a lyophilized peptide?",
        a: "Lyophilized peptides must be reconstituted with a suitable solvent before use. Bacteriostatic water (BAC water) is the most commonly used reconstitution medium — available separately. Protocol: calculate the volume needed for your target concentration, inject BAC water slowly along the inner vial wall (not directly onto the powder), swirl gently — do not shake or vortex — until fully dissolved. Store reconstituted peptide at -4°C and use within 28 days. For research use only.",
      },
    ],
  },
  {
    category: "Returns",
    items: [
      {
        q: "What is your return policy?",
        a: "Due to the nature of research compounds, returns are not accepted once a vial has been opened or reconstituted. Unopened vials in original sealed condition may be eligible for return within 7 days of receipt — contact support@anvilcompounds.shop. Replacements are provided for verified transit damage or fulfillment errors.",
      },
    ],
  },
];

// ─── Accordion item ───────────────────────────────────────────────────────────

function AccordionItem({
  item,
  isOpen,
  onToggle,
  globalIndex,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  globalIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (globalIndex % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen ? "border-blue-500/40 shadow-lg shadow-blue-600/10" : "hover:border-blue-600/25"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        {/* Blue left border indicator */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`shrink-0 w-0.5 h-6 rounded-full transition-all duration-300 ${
              isOpen ? "bg-blue-400" : "bg-blue-600/30 group-hover:bg-blue-600/60"
            }`}
          />
          <span
            className={`font-body text-sm md:text-base leading-snug transition-colors duration-200 ${
              isOpen ? "text-white" : "text-white/70 group-hover:text-white/90"
            }`}
          >
            {item.q}
          </span>
        </div>

        {/* Chevron */}
        <div
          className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "border-blue-500/50 bg-blue-600/20 rotate-180"
              : "border-white/15 group-hover:border-blue-600/30"
          }`}
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`w-3 h-3 transition-colors duration-200 ${
              isOpen ? "text-blue-400" : "text-white/40"
            }`}
          >
            <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-6 pb-6 pl-[calc(1.5rem+0.125rem+1rem)]">
              {/* Aligns with text after the left border + gap */}
              <p className="font-body text-white/45 text-sm leading-relaxed">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Category group ───────────────────────────────────────────────────────────

function CategoryGroup({
  category,
  items,
  openId,
  setOpenId,
  baseIndex,
}: {
  category: string;
  items: FaqItem[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  baseIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div className="mb-12">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4 mb-5"
      >
        <div className="w-4 h-px bg-blue-600/50" />
        <span className="font-mono text-xs text-blue-400/70 tracking-[0.22em] uppercase">
          {category}
        </span>
        <div className="flex-1 h-px bg-blue-600/10" />
      </motion.div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const id = `${category}-${i}`;
          return (
            <AccordionItem
              key={id}
              item={item}
              isOpen={openId === id}
              onToggle={() => setOpenId(openId === id ? null : id)}
              globalIndex={baseIndex + i}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  // Compute flat index offsets per category for staggered animations
  const offsets: number[] = [];
  let counter = 0;
  for (const group of faqs) {
    offsets.push(counter);
    counter += group.items.length;
  }

  return (
    <main className="bg-navy-950 min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "clamp(300px, 42vh, 480px)" }}>
        {/* Same background as homepage hero */}
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

        {/* Centered content with radial glow — mirrors homepage */}
        <div className="relative z-10 flex items-center justify-center h-full w-full pt-24 pb-12 md:pt-32 md:pb-20 px-4">
          <motion.div
            initial="hidden"
            animate="show"
            className="flex flex-col items-center text-center px-4 py-6"
            style={{ background: "radial-gradient(ellipse 80% 90% at 50% 50%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.18) 60%, transparent 100%)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-3 mb-5"
            >
              <div className="w-6 h-px bg-blue-500" />
              <span className="font-mono text-xs text-blue-600 tracking-[0.3em] uppercase">FAQ</span>
              <div className="w-6 h-px bg-blue-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-800 text-gray-950 mb-5"
              style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", textShadow: "0 1px 12px rgba(255,255,255,0.95)" }}
            >
              Common{" "}
              <span style={{ color: "#1D6ADB" }}>Questions</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22 }}
              className="font-body text-gray-700 text-base md:text-lg leading-relaxed max-w-xl"
            >
              Everything you need to know about ordering, testing, and research use.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Accordion ────────────────────────────────────────────────────── */}
      <section className="bg-navy-900 py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          {faqs.map((group, gi) => (
            <CategoryGroup
              key={group.category}
              category={group.category}
              items={group.items}
              openId={openId}
              setOpenId={setOpenId}
              baseIndex={offsets[gi]}
            />
          ))}

          {/* Contact callout */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 p-7 rounded-2xl border border-blue-600/20 bg-blue-600/5 text-center"
          >
            <p className="font-body text-white/50 text-sm mb-4">
              Still have questions? Reach out directly.
            </p>
            <a
              href="mailto:support@anvilcompounds.shop"
              className="inline-flex items-center gap-2 font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors animated-underline"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
              </svg>
              support@anvilcompounds.shop
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
