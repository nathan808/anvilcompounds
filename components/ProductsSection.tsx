"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import type { ProductCard } from "@/lib/woocommerce";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import { getProductDisplayTitle, isGlpCompound } from "@/lib/productTitle";

// Small credibility pills above the catalog header — same idea as a
// competitor's "tested by / sold to / verified" badge row, adapted to what
// we can actually back up (no named lab, no institutional-sales claim).
const CATALOG_TRUST_BADGES: { icon: JSX.Element; label: JSX.Element }[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.106 14.4A2.25 2.25 0 004.447 16v.001c0 1.243 1.007 2.25 2.25 2.25h10.606a2.25 2.25 0 002.25-2.25v-.001a2.25 2.25 0 00-.659-1.591l-3.985-3.99a2.25 2.25 0 01-.659-1.591V3.104M9.75 3.104h4.5M9.75 3.104a48.667 48.667 0 014.5 0" />
      </svg>
    ),
    label: <>Tested by <strong className="text-blue-400 font-600">Freedom Diagnostics</strong> (HPLC + Mass Spec + Endotoxin + Heavy-Metal Screening)</>,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    label: <><strong className="text-blue-400 font-600">21+ verified</strong> researcher accounts</>,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008zM3.75 5.25h16.5v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V5.25z" />
      </svg>
    ),
    label: <><strong className="text-blue-400 font-600">COA</strong> on every lot</>,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    label: <><strong className="text-blue-400 font-600">Same-day dispatch</strong> before 12PM PST</>,
  },
];

// Hidden by default under the "All Compounds" tab on the home page only —
// revealed either by clicking "View All" at the bottom of that grid, or
// immediately if arriving via a link that set ?catalog=full (Catalog nav,
// "View Catalog" CTA, Explore Catalog banner button — see Navbar.tsx /
// HeroSection.tsx). Never hidden under any specific category tab (e.g.
// Metabolic Research) — only under the default "All Compounds" view.
const HOME_HIDDEN_ON_ALL_COMPOUNDS = ["GLP-RT", "GLP-TRZ"];

const PRODUCT_IMAGES: Record<string, string> = {
  "BPC-157":                       "/products/bpc157.png",
  "T1rz":                          "/products/tirz.png",
  "Dual Receptor (T)":             "/products/tirz.png",
  "R3ta":                          "/products/reta.png",
  "Triple Agonist (R)":            "/products/reta.png",
  "triple agonist (R)":            "/products/reta.png",
  "GLP-TRZ":                       "/products/tirz.png",
  "GLP-RT":                        "/products/reta.png",
  "KLOW":                          "/products/klow.png",
  "GHK-Cu":                        "/products/ghkcu.png",
  "TB-500":                        "/products/tb500.png",
  "MOTS-c":                        "/products/motsc.png",
  "BPC-157 + TB-500":              "/products/wolverine.png",
  "NAD+":                          "/products/nad.png",
  "Tesamorelin":                   "/products/tesa.png",
  "CJC-1295 + Ipamorelin":         "/products/cjcipa.png",
  "5-Amino-1MQ":                   "/products/5amino.png",
  "GLOW":                          "/products/glow.png",
  "Semax":                         "https://anvilcompounds.shop/wp-content/uploads/2026/07/semaxproductphoto.png",
  "Selank":                        "https://anvilcompounds.shop/wp-content/uploads/2026/07/selankproductphoto.png",
};

const SLUG_MAP: Record<string, string> = {
  "BPC-157":                                      "bpc-157",
  "T1rz":                                         "t1rz",
  "Trz- dual receptor":                           "t1rz",
  "R3ta":                                         "r3ta",
  "Rta - triple agonist":                         "r3ta",
  "triple agonist (R)":                           "r3ta",
  "Triple Agonist (R)":                           "r3ta",
  "Dual Receptor (T)":                            "t1rz",
  "GLP-TRZ":                                      "glp-trz",
  "GLP-RT":                                       "glp-rt",
  "KLOW":                                         "klow",
  "GHK-Cu":                                       "ghk-cu",
  "TB-500":                                       "tb-500",
  "MOTS-c":                                       "mots-c",
  "Bacteriostatic Water":                         "bac-water",
  "Reconstitution Solution – for Laboratory Use": "bac-water",
  "BPC-157 + TB-500":                              "bpc-157-tb-500",
  "NAD+":                                         "nad-plus",
  "Tesamorelin":                                  "tesamorelin",
  "CJC-1295 + Ipamorelin":                        "cjc-1295-ipamorelin",
  "5-Amino-1MQ":                                  "5-amino-1mq",
  "GLOW":                                         "glow",
  "Semax":                                        "semax",
  "Selank":                                       "selank",
};

// Popularity rank — lower = more popular (shown first)
const POPULARITY_ORDER: Record<string, number> = {
  "BPC-157":                                      1,
  "BPC-157 + TB-500":                              2,
  "T1rz":                                         3,
  "Trz- dual receptor":                           3,
  "Dual Receptor (T)":                            3,
  "R3ta":                                         4,
  "Rta - triple agonist":                         4,
  "triple agonist (R)":                           4,
  "Triple Agonist (R)":                           4,
  "GLP-TRZ":                                      3,
  "GLP-RT":                                       4,
  "KLOW":                                         5,
  "GLOW":                                         6,
  "TB-500":                                       7,
  "GHK-Cu":                                       8,
  "NAD+":                                         9,
  "MOTS-c":                                       10,
  "CJC-1295 + Ipamorelin":                        11,
  "Tesamorelin":                                  12,
  "5-Amino-1MQ":                                  13,
  "Semax":                                        14,
  "Selank":                                       15,
  "Bacteriostatic Water":                         99,
  "Reconstitution Solution – for Laboratory Use": 99,
};

// Canonical category display order
const CATEGORY_ORDER = [
  "All Compounds",
  "Repair & Recovery Research",
  "Metabolic Research",
  "Cognitive Research",
  "Longevity & Cosmetic Research",
  "Growth Pathway Research",
  "Research Supplies",
];

function slugifyProductName(name: string): string {
  return SLUG_MAP[name] ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const FALLBACK_PRODUCTS: ProductCard[] = [
  { id: 332, name: "BPC-157", category: "Repair & Recovery Research", description: "Body Protection Compound — a pentadecapeptide with notable tissue healing and regenerative properties under research conditions.", price: "$44", purity: "99.4%", badge: "Bestseller", badgeColor: "bg-blue-600/70 text-blue-100 border-blue-500/50", icon: "⬡", permalink: "https://anvilcompounds.shop/product/bpc-157/", image: "/products/bpc157.png", hasCoa: true },
  { id: 447, name: "BPC-157 + TB-500", category: "Repair & Recovery Research", description: "Dual peptide recovery blend combining BPC-157 and TB-500 — studied for synergistic effects in tissue repair and cell migration research models.", price: "$54", purity: "99%+", badge: "Recovery Blend", badgeColor: "bg-orange-600/70 text-orange-100 border-orange-500/50", icon: "⬧", permalink: "https://anvilcompounds.shop/product/bpc-157-tb-500/", image: "/products/wolverine.png", hasCoa: false },
  { id: 333, name: "GLP-TRZ", category: "Metabolic Research", description: "A dual incretin receptor agonist binding both GIP and GLP-1 receptors, under active clinical research.", price: "$54", purity: "99.1%", badge: "Advanced", badgeColor: "bg-cyan-600/70 text-cyan-100 border-cyan-500/50", icon: "◇", permalink: "https://anvilcompounds.shop/product/glp-trz/", image: "/products/tirz.png", hasCoa: true },
  { id: 337, name: "GLP-RT", category: "Metabolic Research", description: "A triple receptor agonist targeting GIP, GLP-1, and glucagon receptors — at the frontier of current metabolic research.", price: "$64", purity: "99.0%", badge: "Cutting Edge", badgeColor: "bg-rose-600/70 text-rose-100 border-rose-500/50", icon: "⬟", permalink: "https://anvilcompounds.shop/product/glp-rt/", image: "/products/reta.png", hasCoa: true },
  { id: 335, name: "KLOW", category: "Longevity & Cosmetic Research", description: "A curated blend of four research-grade peptides, independently tested as a combined formulation.", price: "$89", purity: "99.3%", badge: "Exclusive Blend", badgeColor: "bg-purple-600/70 text-purple-100 border-purple-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/klow/", image: "/products/klow.png", hasCoa: true },
  { id: 354, name: "TB-500", category: "Repair & Recovery Research", description: "Synthetic analogue of Thymosin Beta-4, studied in cell migration, actin dynamics, and tissue modeling research models.", price: "$64", purity: "99%+", badge: "Recovery", badgeColor: "bg-amber-600/70 text-amber-100 border-amber-500/50", icon: "◉", permalink: "https://anvilcompounds.shop/product/tb-500/", image: "/products/tb500.png", hasCoa: true },
  { id: 336, name: "GHK-Cu", category: "Longevity & Cosmetic Research", description: "A naturally occurring copper complex with extensive research into cellular remodeling and tissue response.", price: "$34", purity: "99.5%", badge: "Entry Point", badgeColor: "bg-teal-600/70 text-teal-100 border-teal-500/50", icon: "⬢", permalink: "https://anvilcompounds.shop/product/ghk-cu/", image: "/products/ghkcu.png", hasCoa: true },
  { id: 346, name: "MOTS-c", category: "Metabolic Research", description: "Mitochondrial-derived peptide studied in mitochondrial-nuclear communication, glucose metabolism, and cellular stress response.", price: "$44", purity: "99%+", badge: "Metabolic", badgeColor: "bg-violet-600/70 text-violet-100 border-violet-500/50", icon: "⬥", permalink: "https://anvilcompounds.shop/product/mots-c/", image: "/products/motsc.png", hasCoa: true },
  { id: 510, name: "Semax", category: "Cognitive Research", description: "Synthetic heptapeptide analogue of ACTH(4-10), studied in research involving neurotrophic factor expression, BDNF signaling, and neuroprotective pathway models.", price: "$44", purity: "99%+", badge: "Neuropeptide", badgeColor: "bg-indigo-600/70 text-indigo-100 border-indigo-500/50", icon: "◈", permalink: "https://anvilcompounds.shop/product/semax/", image: "https://anvilcompounds.shop/wp-content/uploads/2026/07/semaxproductphoto.png", hasCoa: false },
  { id: 511, name: "Selank", category: "Cognitive Research", description: "Synthetic heptapeptide analogue of tuftsin, studied in research involving GABAergic pathway modulation, neuropeptide signaling, and anxiety response models.", price: "$44", purity: "99%+", badge: "Neuropeptide", badgeColor: "bg-indigo-600/70 text-indigo-100 border-indigo-500/50", icon: "◉", permalink: "https://anvilcompounds.shop/product/selank/", image: "https://anvilcompounds.shop/wp-content/uploads/2026/07/selankproductphoto.png", hasCoa: false },
  { id: 349, name: "Bacteriostatic Water", category: "Research Supplies", description: "0.9% benzyl alcohol sterile water. Standard reconstitution solvent for lyophilized peptide research. 30mL multi-use vial.", price: "$15", purity: "Sterility Certified", badge: "Essential Supply", badgeColor: "bg-slate-600/70 text-slate-100 border-slate-500/50", icon: "◎", permalink: "https://anvilcompounds.shop/product/bac-water/", image: null, hasCoa: true },
];

function ProductCard({ product, index }: { product: ProductCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { addItem, openCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  // GLP compounds are inquiry-gated: guests can't view, add to cart, or
  // check the COA from the catalog card until they log in. Same
  // /account?redirect= pattern used for the GLP COA gate elsewhere.
  const glpGated = isGlpCompound(product.name) && !isAuthenticated;
  const loginHref = `/account?redirect=${encodeURIComponent(`/products/${slugifyProductName(product.name)}`)}`;

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
        <div className="relative w-full h-[210px] md:h-[240px] bg-white overflow-hidden shrink-0">
          {product.image ? (
            <div className="absolute inset-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain scale-[1.35] transition-transform duration-500 group-hover:scale-[1.42]"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl text-blue-300/40">{product.icon}</span>
            </div>
          )}
          {/* Badge overlay */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className={`text-xs font-mono tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm ${product.badgeColor}`}>
              {product.badge}
            </span>
          </div>
          {/* COA-pending blur overlay */}
          {!product.hasCoa ? (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-navy-950/60 flex flex-col items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="font-mono text-[10px] text-yellow-300 tracking-[0.18em] uppercase text-center px-2">
                Testing in Progress
              </span>
            </div>
          ) : glpGated ? (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-navy-950/60 flex flex-col items-center justify-center gap-2">
              <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-mono text-[10px] text-blue-300 tracking-[0.18em] uppercase text-center px-2">
                Log In to Inquire
              </span>
            </div>
          ) : null}
        </div>

        {/* Card content */}
        <div className="p-3 md:p-5 flex flex-col flex-grow">
          <div className="mb-2 md:mb-3">
            <h3 className="font-display font-700 text-base md:text-xl text-white mb-0.5 leading-tight">
              {getProductDisplayTitle(product.name, product.category)}
            </h3>
            <span className="font-mono text-[10px] md:text-xs text-blue-400/70 tracking-widest uppercase">
              {product.category}
            </span>
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
            <a
              href={glpGated ? loginHref : "/coas"}
              className="block w-full text-center mb-1.5 md:mb-2 px-2 md:px-3 py-1.5 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300"
            >
              View COA
            </a>
            <div className="flex gap-1.5 md:gap-2">
              <a
                href={glpGated ? loginHref : `/products/${slugifyProductName(product.name)}`}
                className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300"
              >
                View
              </a>
              {glpGated ? (
                <button
                  onClick={() => router.push(loginHref)}
                  className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 border border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 hover:text-blue-200 text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300"
                >
                  Log In to Inquire
                </button>
              ) : product.hasCoa ? (
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
              ) : (
                <span className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 border border-yellow-500/20 bg-yellow-500/5 text-yellow-400/70 text-[10px] md:text-xs font-mono rounded-lg cursor-default">
                  Testing in Progress
                </span>
              )}
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
      <div className="w-full h-[210px] md:h-[300px] bg-white/5" />
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

  const searchParams = useSearchParams();
  // Arrived via a link that set ?catalog=full (Catalog nav / View Catalog /
  // Explore Catalog) — GLP-RT/GLP-TRZ show in their normal sorted position
  // (first row) immediately, no click needed.
  const revealedViaLink = searchParams.get("catalog") === "full";
  // Arrived by scrolling and clicking "View All" at the bottom of the grid —
  // GLP-RT/GLP-TRZ appear appended at the end instead, since jumping them
  // into their normal (much earlier) sorted position after a deliberate
  // "reveal" click would be a jarring layout shift.
  const [revealedViaClick, setRevealedViaClick] = useState(false);

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

  const byPopularity = (a: ProductCard, b: ProductCard) => {
    const rankA = POPULARITY_ORDER[a.name] ?? 50;
    const rankB = POPULARITY_ORDER[b.name] ?? 50;
    return rankA - rankB;
  };

  const filtered = useMemo(() => {
    let base = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );

    if (selectedCategory !== "All Compounds") {
      // Hiding is scoped only to the default "All Compounds" view — any
      // specific category tab (including Metabolic Research, which is where
      // GLP-RT/GLP-TRZ actually live) shows everything normally.
      return base.filter((p) => p.category === selectedCategory).sort(byPopularity);
    }

    if (revealedViaLink) {
      return base.sort(byPopularity);
    }

    const isHidden = (p: ProductCard) => HOME_HIDDEN_ON_ALL_COMPOUNDS.includes(p.name);
    const visible = base.filter((p) => !isHidden(p)).sort(byPopularity);

    if (revealedViaClick) {
      const revealed = base.filter(isHidden).sort(byPopularity);
      return [...visible, ...revealed];
    }

    return visible;
  }, [products, search, selectedCategory, revealedViaLink, revealedViaClick]);

  const hasHiddenCompounds =
    selectedCategory === "All Compounds" &&
    !revealedViaLink &&
    !revealedViaClick &&
    products.some((p) => HOME_HIDDEN_ON_ALL_COMPOUNDS.includes(p.name));

  return (
    <section id="catalog" className="relative bg-navy-950 py-24 md:py-32">
      <div className="absolute inset-0 mesh-bg opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center gap-2.5 mb-6"
          >
            {CATALOG_TRUST_BADGES.map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5"
              >
                <span className="text-blue-400 shrink-0">{badge.icon}</span>
                <span className="font-mono text-[11px] text-white/50 tracking-wide whitespace-nowrap">
                  {badge.label}
                </span>
              </div>
            ))}
          </motion.div>

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
                Reference materials
                <br />
                <span className="text-blue-400">&amp; research compounds</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={headerInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="font-body text-white/45 text-lg max-w-xl"
              >
                Each compound is a synthetic reference material supplied for
                in-vitro laboratory research.
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
                    setRevealedViaClick(false);
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
                <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-16 text-white/30 font-body">
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

        {/* "View All" — reveals GLP-RT/GLP-TRZ under the All Compounds tab.
            Home page only behavior; any specific category tab always shows
            everything, and arriving via a Catalog/Explore-Catalog link skips
            this entirely (revealedViaLink short-circuits hasHiddenCompounds). */}
        {!loading && hasHiddenCompounds && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                setRevealedViaClick(true);
                // The revealed items are appended at the very end of the
                // list, which on mobile would otherwise still be caught by
                // the unrelated 6-item mobile cutoff above — "View All"
                // should actually show them, not hide them behind a second gate.
                setMobileShowAll(true);
              }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
            >
              View All
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
