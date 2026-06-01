"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import type { ProductCard } from "@/lib/woocommerce";

function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const FALLBACK_PRODUCTS: ProductCard[] = [
  {
    id: 0,
    name: "BPC-157",
    category: "Repair & Recovery",
    description: "Body Protection Compound — a pentadecapeptide with notable tissue healing and regenerative properties under research conditions.",
    price: "$35",
    purity: "99.4%",
    badge: "Bestseller",
    badgeColor: "bg-blue-600/20 text-blue-300 border-blue-600/30",
    icon: "⬡",
    permalink: "#",
    image: null,
  },
  {
    id: 1,
    name: "Semaglutide",
    category: "GLP-1 Receptor Agonist",
    description: "A glucagon-like peptide-1 receptor agonist studied for its metabolic and appetite-regulating mechanisms.",
    price: "$45",
    purity: "99.2%",
    badge: "High Demand",
    badgeColor: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
    icon: "◈",
    permalink: "#",
    image: null,
  },
  {
    id: 2,
    name: "Tirzepatide",
    category: "Dual GIP/GLP-1 Agonist",
    description: "A dual incretin receptor agonist binding both GIP and GLP-1 receptors, under active clinical research.",
    price: "$70",
    purity: "99.1%",
    badge: "Advanced",
    badgeColor: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30",
    icon: "◇",
    permalink: "#",
    image: null,
  },
  {
    id: 3,
    name: "KGLOW",
    category: "4-Peptide Blend",
    description: "A curated blend of four research-grade peptides, independently tested as a combined formulation.",
    price: "$100",
    purity: "99.3%",
    badge: "Exclusive Blend",
    badgeColor: "bg-purple-600/20 text-purple-300 border-purple-600/30",
    icon: "✦",
    permalink: "#",
    image: null,
  },
  {
    id: 4,
    name: "GHK-Cu",
    category: "Copper Tripeptide-1",
    description: "A naturally occurring copper complex with extensive research into cellular remodeling and tissue response.",
    price: "$30",
    purity: "99.5%",
    badge: "Entry Point",
    badgeColor: "bg-teal-600/20 text-teal-300 border-teal-600/30",
    icon: "⬢",
    permalink: "#",
    image: null,
  },
  {
    id: 5,
    name: "Retatrutide",
    category: "Triple Incretin Agonist",
    description: "A triple receptor agonist targeting GIP, GLP-1, and glucagon receptors — at the frontier of current metabolic research.",
    price: "$85",
    purity: "99.0%",
    badge: "Cutting Edge",
    badgeColor: "bg-rose-600/20 text-rose-300 border-rose-600/30",
    icon: "⬟",
    permalink: "#",
    image: null,
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
      <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col transition-all duration-500 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-600/10 hover:-translate-y-1">

        {/* Product image */}
        <div className="relative w-full h-48 bg-navy-800 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl text-blue-400/30">{product.icon}</span>
            </div>
          )}
          {/* Badge overlay */}
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-mono tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${product.badgeColor}`}>
              {product.badge}
            </span>
          </div>
        </div>

        {/* Card content */}
        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-3">
            <h3 className="font-display font-700 text-xl text-white mb-1">{product.name}</h3>
            <span className="font-mono text-xs text-blue-400/70 tracking-widest uppercase">
              {product.category}
            </span>
          </div>

          <p className="font-body text-sm text-white/45 leading-relaxed mb-5 flex-grow">
            {product.description}
          </p>

          {/* Purity bar */}
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

          {/* Price + buttons */}
          <div className="pt-4 border-t border-white/8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-xs text-white/30 block tracking-wider">From</span>
                <span className="font-display font-800 text-2xl text-white">{product.price}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`/products/${slugifyProductName(product.name)}`}
                className="flex-1 text-center px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-sm font-display font-600 rounded-lg transition-all duration-300"
              >
                View
              </a>
              <a
                href={product.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-3 py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/30 hover:border-blue-500 text-blue-300 hover:text-white text-sm font-display font-600 rounded-lg transition-all duration-300"
              >
                Order
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-white/5" />
      <div className="p-6 space-y-3">
        <div className="w-1/2 h-5 bg-white/5 rounded" />
        <div className="w-1/3 h-3 bg-white/5 rounded" />
        <div className="space-y-2 pt-2">
          <div className="w-full h-3 bg-white/5 rounded" />
          <div className="w-4/5 h-3 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="catalog" className="relative bg-navy-950 py-24 md:py-32">
      <div className="absolute inset-0 mesh-bg opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="mb-10">
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

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
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

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full md:w-72 shrink-0"
            >
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search compounds..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-lg text-white placeholder-white/30 font-body text-sm outline-none transition-all duration-300"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length > 0
              ? filtered.map((product, i) => (
                  <ProductCard key={product.name} product={product} index={i} />
                ))
              : (
                <div className="col-span-3 text-center py-16 text-white/30 font-body">
                  No compounds match &ldquo;{search}&rdquo;
                </div>
              )
          }
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
