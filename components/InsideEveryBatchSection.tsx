"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

export default function InsideEveryBatchSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-white py-24 md:py-32 overflow-hidden">
      <div ref={ref} className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-navy-900/10"
        >
          <Image
            src="/images/homepage/scientist.jpg"
            alt="Research scientist reviewing chromatogram data on a monitor in a lab"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-600 tracking-[0.25em] uppercase">
              005 / Inside the Lab
            </span>
          </div>
          <h2
            className="font-display font-800 text-navy-900 mb-5"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)" }}
          >
            Inside Every Batch
          </h2>
          <p className="font-body text-navy-900/55 text-lg leading-relaxed mb-3">
            Anyone can print 99% pure on a label. Real people run the assays
            that prove it — and put their name on the result.
          </p>
          <p className="font-body text-navy-900/55 text-lg leading-relaxed">
            Each lot&rsquo;s data ships with it: purity, identity,
            contamination screen. Read the numbers before your experiment,
            not after.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
