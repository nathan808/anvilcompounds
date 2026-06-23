"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import type { ProductCard } from "@/lib/woocommerce";
import { useCart } from "@/lib/cartContext";

const PRODUCT_IMAGES: Record<string, string> = {
  "BPC-157":                       "/products/bpc157.png",
  "T1rz":                          "/products/tirz.png",
  "R3ta":                          "/products/reta.png",
  "KLOW":                          "/products/klow.png",
  "GHK-Cu":                        "/products/ghkcu.png",
  "TB-500":                        "/products/tb500.png",
  "MOTS-c":                        "/products/motsc.png",
  "Wolverine — BPC-157 + TB-500":  "/products/wolverine.png",
  "NAD+":                          "/products/nad.png",
  "Tesamorelin":                   "/products/tesa.png",
  "CJC-1295 + Ipamorelin":         "/products/cjcipa.png",
  "5-Amino-1MQ":                   "/products/5amino.png",
  "GLOW":                          "/products/glow.png",
};

// Size variants shown on catalog cards
const PRODUCT_SIZES: Record<string, string[]> = {
  "BPC-157":                       ["10mg"],
  "T1rz":                          ["10mg", "20mg"],
  "R3ta":                          ["10mg", "20mg"],
  "KLOW":                          ["80mg blend"],
  "GHK-Cu":                        ["50mg", "100mg"],
  "TB-500":                        ["10mg"],
  "MOTS-c":                        ["10mg"],
  "Bacteriostatic Water":          ["30mL × 1"],
  "Wolverine — BPC-157 + TB-500":  ["5mg BPC-157 + 5mg TB-500"],
  "NAD+":                          ["500mg"],
  "Tesamorelin":                   ["10mg"],
  "CJC-1295 + Ipamorelin":         ["5mg + 5mg blend"],
  "5-Amino-1MQ":                   ["5mg", "10mg"],
  "GLOW":                          ["70mg blend"],
};

const SLUG_MAP: Record<string, string> = {
  "BPC-157":                       "bpc-157",
  "T1rz":                          "t1rz",
  "R3ta":                          "r3ta",
  "KLOW":                          "klow",
  "GHK-Cu":                        "ghk-cu",
  "TB-500":                        "tb-500",
  "MOTS-c":                        "mots-c",
  "Bacteriostatic Water":          "bac-water",
  "Wolverine — BPC-157 + TB-500":  "wolverine",
  "NAD+":                          "nad-plus",
  "Tesamorelin":                   "tesamorelin",
  "CJC-1295 + Ipamorelin":         "cjc-1295-ipamorelin",
  "5-Amino-1MQ":                   "5-amino-1mq",
  "GLOW":                          "glow",
};

// Popularity rank — lower = more popular (shown first)
const POPULARITY_ORDER: Record<string, number> = {
  "BPC-157":                       1,
  "Wolverine — BPC-157 + TB-500":  2,
  "T1rz":                          3,
  "R3ta":                          4,
  "KLOW":                          5,
  "GLOW":                          6,
  "TB-500":                        7,
  "GHK-Cu":                        8,
  "NAD+":                          9,
  "MOTS-c":                        10,
  "CJC-1295 + Ipamorelin":         11,
  "Tesamorelin":                   12,
  "5-Amino-1MQ":                   13,
  "Bacteriostatic Water":          99,
};

// Canonical category display order
const CATEGORY_ORDER = [
  "All Compounds",
  "Repair & Recovery Research",
  "Metabolic Research",
  "Longevity & Cosmetic Research",
  "Growth Pathway Research",
  "Research Supplies",
];

function slugifyProductName(name: string): string {
  return SLUG_MAP[name] ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const FALLBACK_PRODUCTS: ProductCard[] = [
  {
    id: 332,
    name: "BPC-157",
    category: "Repair & Recovery Research",
    description: "Body Protection Compound — a pentadecapeptide with notable tissue healing and regenerative properties under research conditions.",
    price: "$44",
    purity: "99.4%",
    badge: "Bestseller",
    badgeColor: "bg-blue-600/70 text-blue-100 border-blue-500/50",
    icon: "⬡",
    permalink: "https://anvilcompounds.shop/product/bpc-157/",
    image: "/products/bpc157.png",
  },
  {
    id: 447,
    name: "Wolverine — BPC-157 + TB-500",
    category: "Repair & Recovery Research",
    description: "Dual peptide recovery blend combining BPC-157 and TB-500 — studied for synergistic effects in tissue repair and cell migration research models.",
    price: "$54",
    purity: "99%+",
    badge: "Recovery Blend",
    badgeColor: "bg-orange-600/70 text-orange-100 border-orange-500/50",
    icon: "⬧",
    permalink: "https://anvilcompounds.shop/product/wolverine/",
    image: "/products/wolverine.png",
  },
  {
    id: 333,
    name: "T1rz",
    category: "Metabolic Research",
    description: "A dual incretin receptor agonist binding both GIP and GLP-1 receptors, under active clinical research.",
    price: "$54",
    purity: "99.1%",
    badge: "Advanced",
    badgeColor: "bg-cyan-600/70 text-cyan-100 border-cyan-500/50",
    icon: "◇",
    permalink: "https://anvilcompounds.shop/product/t1rz/",
    image: "/products/tirz.png",
  },
  {
    id: 337,
    name: "R3ta",
    category: "Metabolic Research",
    description: "A triple receptor agonist targeting GIP, GLP-1, and glucagon receptors — at the frontier of current metabolic research.",
    price: "$64",
    purity: "99.0%",
    badge: "Cutting Edge",
    badgeColor: "bg-rose-600/70 text-rose-100 border-rose-500/50",
    icon: "⬟",
    permalink: "https://anvilcompounds.shop/product/r3ta/",
    image: "/products/reta.png",
  },
  {
    id: 335,
    name: "KLOW",
    category: "Longevity & Cosmetic Research",
    description: "A curated blend of four research-grade peptides, independently tested as a combined formulation.",
    price: "$89",
    purity: "99.3%",
    badge: "Exclusive Blend",
    badgeColor: "bg-purple-600/70 text-purple-100 border-purple-500/50",
    icon: "✦",
    permalink: "https://anvilcompounds.shop/product/klow/",
    image: "/products/klow.png",
  },
  {
    id: 354,
    name: "TB-500",
    category: "Repair & Recovery Research",
    description: "Synthetic analogue of Thymosin Beta-4, studied in cell migration, actin dynamics, and tissue modeling research models.",
    price: "$64",
    purity: "99%+",
    badge: "Recovery",
    badgeColor: "bg-amber-600/70 text-amber-100 border-amber-500/50",
    icon: "◉",
    permalink: "https://anvilcompounds.shop/product/tb-500/",
    image: "/products/tb500.png",
  },
  {
    id: 336,
    name: "GHK-Cu",
    category: "Longevity & Cosmetic Research",
    description: "A naturally occurring copper complex with extensive research into cellular remodeling and tissue response.",
    price: "$34",
    purity: "99.5%",
    badge: "Entry Point",
    badgeColor: "bg-teal-600/70 text-teal-100 border-teal-500/50",
    icon: "⬢",
    permalink: "https://anvilcompounds.shop/product/ghk-cu/",
    image: "/products/ghkcu.png",
  },
  {
    id: 346,
    name: "MOTS-c",
    category: "Metabolic Research",
    description: "Mitochondrial-derived peptide studied in mitochondrial-nuclear communication, glucose metabolism, and cellular stress response.",
    price: "$44",
    purity: "99%+",
    badge: "Metabolic",
    badgeColor: "bg-violet-600/70 text-violet-100 border-violet-500/50",
    icon: "⬥",
    permalink: "https://anvilcompounds.shop/product/mots-c/",
    image: "/products/motsc.png",
  },
  {
    id: 349,
    name: "Bacteriostatic Water",
    category: "Research Supplies",
    description: "0.9% benzyl alcohol sterile water. Standard reconstitution solvent for lyophilized peptide research. 30mL multi-use vial.",
    price: "$15",
    purity: "Sterility Certified",
    badge: "Essential Supply",
    badgeColor: "bg-slate-600/70 text-slate-100 border-slate-500/50",
    icon: "◎",
    permalink: "https://anvilcompounds.shop/product/bac-water/",
    image: null,
  },
];

function ProductCard({ product, index }: { product: ProductCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
    const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0;
    addItem({
      slug: slugifyProductName(product.name),
      name: product.name,
      size: "Standard",
      price: priceNum,
      wcProductId: product.id,
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [product, addItem, openCart]);

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
        <div className="relative w-full h-[168px] md:h-[248px] bg-navy-800 overflow-hidden shrink-0">
          {product.image ? (
            <>
              {/* Blurred ambient fill — fills any edge gaps */}
              <Image
                src={product.image}
                alt=""
                fill
                aria-hidden="true"
                className="object-cover scale-125 blur-lg brightness-90 saturate-110"
              />
              {/* Main image — contained so label is never clipped, slight scale for focal zoom */}
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain scale-[1.05] z-10 transition-transform duration-500 group-hover:scale-110"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl text-blue-400/30">{product.icon}</span>
            </div>
          )}
          {/* Badge overlay */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className={`text-xs font-mono tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm ${product.badgeColor}`}>
              {product.badge}
            </span>
          </div>
        </div>

        {/* Card content */}
        <div className="p-3 md:p-5 flex flex-col flex-grow">
          <div className="mb-2 md:mb-3">
            <h3 className="font-display font-700 text-base md:text-xl text-white mb-0.5 leading-tight">{product.name}</h3>
            <span className="font-mono text-[10px] md:text-xs text-blue-400/70 tracking-widest uppercase">
              {product.category}
            </span>
            {PRODUCT_SIZES[product.name] && (
              <div className="flex flex-wrap gap-1 mt-1">
                {PRODUCT_SIZES[product.name].map((s) => (
                  <span key={s} className="font-mono text-[8px] md:text-[9px] text-white/35 bg-white/5 border border-white/8 rounded px-1.5 py-0.5 tracking-wider">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="font-body text-xs md:text-sm text-white/45 leading-relaxed mb-3 md:mb-4 flex-grow line-clamp-3 md:line-clamp-none">
            {product.description}
          </p>

          {/* Purity bar */}
          <div className="mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9px] md:text-xs text-white/35 tracking-widest uppercase">Verified Purity</span>
              <span className="font-mono text-[10px] md:text-xs text-blue-400 font-500">{product.purity}</span>
            </div>
            <div className="h-0.5 md:h-1 w-full bg-white/8 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: product.purity } : {}}
                transition={{ duration: 1.2, delay: index * 0.08 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
              />
            </div>
          </div>

          {/* Price + buttons */}
          <div className="pt-2.5 md:pt-3.5 border-t border-white/8">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div>
                <span className="font-mono text-[9px] md:text-xs text-white/30 block tracking-wider">From</span>
                <span className="font-display font-800 text-lg md:text-2xl text-white">{product.price}</span>
              </div>
            </div>
            <div className="flex gap-1.5 md:gap-2">
              <a
                href={`/products/${slugifyProductName(product.name)}`}
                className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300"
              >
                View
              </a>
              <button
                onClick={handleAddToCart}
                className={`flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 border text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300 ${
                  added
                    ? "bg-green-600/20 border-green-500/40 text-green-300"
                    : "bg-blue-600/20 hover:bg-blue-600 border-blue-600/30 hover:border-blue-500 text-blue-300 hover:text-white"
                }`}
              >
                {added ? "✓ Added" : "Add to Cart"}
              </button>
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
      <div className="w-full h-[168px] md:h-[248px] bg-white/5" />
      <div className="p-3 md:p-5 space-y-2 md:space-y-3">
        <div className="w-1/2 h-4 md:h-5 bg-white/5 rounded" />
        <div className="w-1/3 h-2.5 md:h-3 bg-white/5 rounded" />
        <div className="space-y-1.5 md:space-y-2 pt-1.5 md:pt-2">
          <div className="w-full h-2.5 md:h-3 bg-white/5 rounded" />
          <div className="w-4/5 h-2.5 md:h-3 bg-white/5 rounded" />
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
  const [mobileShowAll, setMobileShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Compounds");

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

  // Derive sorted, deduplicated category list from live products
  const categories = useMemo(() => {
    const found = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
    const ordered = CATEGORY_ORDER.filter((c) => c === "All Compounds" || found.includes(c));
    // Add any categories from live data not in the hardcoded order
    found.forEach((c) => { if (!ordered.includes(c)) ordered.push(c); });
    return ordered;
  }, [products]);

  const filtered = useMemo(() => {
    let base = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedCategory !== "All Compounds") {
      base = base.filter((p) => p.category === selectedCategory);
    }
    return base.sort((a, b) => {
      const rankA = POPULARITY_ORDER[a.name] ?? 50;
      const rankB = POPULARITY_ORDER[b.name] ?? 50;
      return rankA - rankB;
    });
  }, [products, search, selectedCategory]);

  return (
    <section id="catalog" className="relative bg-navy-950 py-24 md:py-32">
      <div className="absolute inset-0 mesh-bg opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
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

        {/* Category filter buttons */}
        {!loading && categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setMobileShowAll(false);
                  }}
                  className={`font-mono text-xs tracking-wide px-4 py-2 rounded-lg border transition-all duration-250 whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25"
                      : "bg-blue-600/10 text-blue-400 border-blue-500/25 hover:bg-blue-600/20 hover:border-blue-500/50 hover:text-blue-300"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length > 0
              ? filtered.map((product, i) => (
                  <div
                    key={product.name}
                    className={i >= 6 && !mobileShowAll ? "hidden md:contents" : "contents"}
                  >
                    <ProductCard product={product} index={i} />
                  </div>
                ))
              : (
                <div className="col-span-2 md:col-span-3 text-center py-16 text-white/30 font-body">
                  No compounds match &ldquo;{search}&rdquo;
                </div>
              )
          }
        </div>

        {/* Mobile-only "View Full Catalog" button */}
        {!loading && !mobileShowAll && filtered.length > 6 && (
          <div className="mt-6 flex justify-center md:hidden">
            <button
              onClick={() => setMobileShowAll(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
            >
              View Full Catalog
            </button>
          </div>
        )}

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
