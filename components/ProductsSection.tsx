"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { ProductCard } from "@/lib/woocommerce";

const FALLBACK_PRODUCTS: ProductCard[] = [
  {
    name: "BPC-157",
    category: "Repair & Recovery",
    description: "Body Protection Compound — a pentadecapeptide with notable tissue healing and regenerative properties under research conditions.",
    price: "$35",
    purity: "99.4%",
    badge: "Bestseller",
    badgeColor: "bg-blue-600/20 text-blue-300 border-blue-600/30",
    icon: "⬡",
  },
  {
    name: "Semaglutide",
    category: "GLP-1 Receptor Agonist",
    description: "A glucagon-like peptide-1 receptor agonist studied for its metabolic and appetite-regulating mechanisms.",
    price: "$45",
    purity: "99.2%",
    badge: "High Demand",
    badgeColor: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
    icon: "◈",
  },
  {
    name: "Tirzepatide",
    category: "Dual GIP/GLP-1 Agonist",
    description: "A dual incretin receptor agonist binding both GIP and GLP-1 receptors, under active clinical research.",
    price: "$70",
    purity: "99.1%",
    badge: "Advanced",
    badgeColor: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",
    icon: "◇",
  },
  {
    name: "KGLOW",
    category: "4-Peptide Blend",
    description: "A curated blend of four research-grade peptides, independently tested as a combined formulation.",
    price: "$100",
    purity: "99.3%",
    badge: "Exclusive Blend",
    badgeColor: "bg-purple-600/20 text-purple-300 border-purple-600/30",
    icon: "✦",
  },
  {
    name: "GHK-Cu",
    category: "Copper Tripeptide-1",
    description: "A naturally occurring copper complex with extensive research into cellular remodeling and tissue response.",
    price: "$30",
    purity: "99.5%",
    badge: "Entry Point",
    badgeColor: "bg-teal-600/20 text-teal-300 border-teal-600/30",
    icon: "⬢",
  },
  {
    name: "Retatrutide",
    category: "Triple Incretin Agonist",
    description: "A triple receptor agonist targeting GIP, GLP-1, and glucagon receptors — at the frontier of current metabolic research.",
    price: "$85",
    purity: "99.0%",
    badge: "Cutting Edge",
    badgeColor: "bg-rose-600/20 text-rose-300 border-rose-600/30",
    icon: "⬟",
  },
];

function ProductCard({ product, index }: { product: ProductCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="glass-card rounded-xl p-6 h-full flex flex-col transition-all duration-500 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-600/10 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-600/20 flex items-center justify-center text-blue-400 text-lg">
            {product.icon}
          </div>
          <span className={`text-xs font-mono tracking-wider px-2.5 py-1 rounded-full border ${product.badgeColor}`}>
            {product.badge}
          </span>
        </div>

        <div className="mb-3">
          <h3 className="font-display font-700 text-xl text-white mb-1">{product.name}</h3>
          <span className="font-mono text-xs text-blue-400/70 tracking-widest uppercase">
            {product.category}
          </span>
        </div>

        <p className="font-body text-sm text-white/45 leading-relaxed mb-5 flex-grow">
          {product.description}
        </p>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs text-white/35 tracking-widest uppercase">Verified Purity</span>
            <span className="font-mono text-xs text-blue-400 font-500">{product.purity}</span>
          </div>
          <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: product.purity } : {}}
              transition={{ duration: 1.2, delay: index * 0.08 + 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/8">
          <div>
            <span className="font-mono text-xs text-white/30 block tracking-wider">From</span>
            <span className="font-display font-800 text-2xl text-white">{product.price}</span>
          </div>
          <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/30 hover:border-blue-500 text-blue-300 hover:text-white text-sm font-display font-600 rounded-lg transition-all duration-300">
            Inquire
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-6 h-64 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/5" />
        <div className="w-20 h-6 rounded-full bg-white/5" />
      </div>
      <div className="w-1/2 h-5 bg-white/5 rounded mb-2" />
      <div className="w-1/3 h-3 bg-white/5 rounded mb-4" />
      <div className="space-y-2">
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-4/5 h-3 bg-white/5 rounded" />
        <div className="w-3/5 h-3 bg-white/5 rounded" />
      </div>
    </div>
  );
}

export default function ProductsSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      })
      .catch(() => setProducts(FALLBACK_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="catalog" className="relative bg-navy-950 py-24 md:py-32">
      <div className="absolute inset-0 mesh-bg opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div ref={headerRef} className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
              002 / Research Catalog
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-800 text-white mb-4"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
          >
            Independently Verified
            <br />
            <span className="text-blue-400">Compounds</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-white/45 text-lg max-w-xl"
          >
            All compounds ship as lyophilized powder with full COA documentation.
            For in vitro laboratory and research use only.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((product, i) => (
                <ProductCard key={product.name} product={product} index={i} />
              ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center font-mono text-xs text-white/25 tracking-wide"
        >
          All products are for in vitro laboratory and research use only. Must be 21+ to purchase.
          Not intended for human or veterinary use.
        </motion.p>
      </div>
    </section>
  );
}
