"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

// The "Southern California" callout, promoted to its own full section and
// paired with a shipping photo — previously a nested card inside
// TrustSection. See INTEGRATION-BRIEF.md section 06 / Operations.
export default function OperationsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-mock-page py-[76px] overflow-hidden">
      <div ref={ref} className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-mock-cobalt pulse-ring" />
            <span className="font-mono text-xs text-mock-cobaltInk tracking-widest uppercase">Southern California</span>
          </div>
          <h2
            className="font-heading font-700 text-mock-navy mb-3"
            style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)" }}
          >
            Domestic. Reliable.
            <br />
            <span className="font-800 italic text-mock-cobalt">Accountable.</span>
          </h2>
          <p className="font-body text-mock-sub text-base leading-relaxed mb-4 max-w-md">
            Prepared and dispatched from our Southern California facility.
            USPS Priority, 2–5 business days, tracking at fulfillment,
            with discreet shipping on every order.
          </p>

          <div className="flex flex-wrap gap-2.5 mb-5">
            <div className="px-3.5 py-2 rounded-lg border border-mock-cobalt/20 bg-mock-cobalt/10">
              <span className="font-mono text-xs text-mock-cobaltInk tracking-wider">USPS Priority</span>
            </div>
            <div className="px-3.5 py-2 rounded-lg border border-mock-cobalt/20 bg-mock-cobalt/10">
              <span className="font-mono text-xs text-mock-cobaltInk tracking-wider">2-5 Day Delivery</span>
            </div>
            <div className="px-3.5 py-2 rounded-lg border border-mock-cobalt/20 bg-mock-cobalt/10">
              <span className="font-mono text-xs text-mock-cobaltInk tracking-wider">Order Tracking</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href="/account?tab=tracking"
              className="px-5 py-2.5 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300"
            >
              Track an Order
            </a>
            <a
              href="/learn?tab=faq"
              className="px-5 py-2.5 border border-mock-line hover:border-mock-cobalt text-mock-cobaltInk hover:text-mock-cobalt font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/60 hover:bg-white/90"
            >
              Shipping FAQ →
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-full max-w-[90%] mx-auto aspect-square rounded-2xl overflow-hidden border border-mock-line"
        >
          <Image
            src="/images/homepage/shipping-box.jpg"
            alt="Three Anvil Compounds vials packed in a protective shipping box with label"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 90vw, 45vw"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  );
}
