"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/lib/woocommerce";
import CoaModal from "@/components/CoaModal";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import { getProductDisplayTitle, isLoginGatedCompound, getCompoundReveal } from "@/lib/productTitle";
import CompoundRevealBadge from "@/components/CompoundRevealBadge";
import { simplifySizeLabel } from "@/lib/reconstitution";
import { BOGO_ENABLED, BOGO_EXCLUDED_PRODUCT_IDS, BUNDLE_PRODUCT_IDS } from "@/lib/bogoDiscount";

// Small credibility pills above the catalog header — same idea as a
// competitor's "tested by / sold to / verified" badge row, adapted to what
// we can actually back up (no named lab, no institutional-sales claim).
export const CATALOG_TRUST_BADGES: { icon: JSX.Element; label: JSX.Element }[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.106 14.4A2.25 2.25 0 004.447 16v.001c0 1.243 1.007 2.25 2.25 2.25h10.606a2.25 2.25 0 002.25-2.25v-.001a2.25 2.25 0 00-.659-1.591l-3.985-3.99a2.25 2.25 0 01-.659-1.591V3.104M9.75 3.104h4.5M9.75 3.104a48.667 48.667 0 014.5 0" />
      </svg>
    ),
    label: <>Tested by <strong className="text-mock-cobaltInk font-600">Freedom Diagnostics</strong></>,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    label: <><strong className="text-mock-cobaltInk font-600">21+ verified</strong> researcher accounts</>,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008zM3.75 5.25h16.5v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V5.25z" />
      </svg>
    ),
    label: <><strong className="text-mock-cobaltInk font-600">COA</strong> on every lot</>,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    label: <><strong className="text-mock-cobaltInk font-600">Same-day dispatch</strong> before 12PM PST</>,
  },
];

// Hidden by default under the "All Compounds" tab only — revealed either by
// clicking "View All" at the bottom of that grid, or immediately if arriving
// via a link that set ?catalog=full (Catalog nav, "View Catalog" CTA,
// Explore Catalog banner button — see Navbar.tsx / HeroSection.tsx). Never
// hidden under any specific category tab (e.g. Metabolic Research) — only
// under the default "All Compounds" view. AC3R (formerly GLP-RT) is
// deliberately NOT in this list — it's the catalog's leading product and
// should always show first.
const HOME_HIDDEN_ON_ALL_COMPOUNDS = ["GLP-TRZ", "AC2T"];

const PRODUCT_IMAGES: Record<string, string> = {
  "BPC-157":                       "/products/bpc157.jpg",
  "T1rz":                          "/products/glp-trz.png",
  "Dual Receptor (T)":             "/products/glp-trz.png",
  "R3ta":                          "/products/glp-rt.jpg",
  "Triple Agonist (R)":            "/products/glp-rt.jpg",
  "triple agonist (R)":            "/products/glp-rt.jpg",
  "GLP-TRZ":                       "/products/glp-trz.png",
  "GLP-RT":                        "/products/glp-rt.jpg",
  "AC2T":                          "/products/glp-trz.png",
  "AC3R":                          "/products/glp-rt.jpg",
  "KLOW":                          "/products/klow.jpg",
  "GHK-Cu":                        "/products/ghkcu.jpg",
  "TB-500":                        "/products/tb500.jpg",
  "MOTS-c":                        "/products/motsc.png",
  "BPC-157 + TB-500":              "/products/wolverine.jpg",
  "NAD+":                          "/products/nad.png",
  "Tesamorelin":                   "/products/tesa.png",
  "CJC-1295 + Ipamorelin":         "/products/cjcipa.png",
  "5-Amino-1MQ":                   "/products/5amino.png",
  "GLOW":                          "/products/glow.jpg",
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
  "GLP-TRZ":                                      "ac2t",
  "GLP-RT":                                       "ac3r",
  "AC2T":                                         "ac2t",
  "AC3R":                                         "ac3r",
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

// Pinned leading row (Aug 2026) — these five always lead the grid in this
// exact order, ahead of the live/gated + popularity sort below. Everything
// not listed here falls through to that normal sort untouched.
const LEADING_ROW_ORDER: Record<string, number> = {
  "GLP-RT":  0,
  "AC3R":    0,
  "GLP-TRZ": 1,
  "AC2T":    1,
  "GLOW":    2,
  "BPC-157": 3,
  "GHK-Cu":  4,
};

// Popularity rank — lower = more popular (shown first)
const POPULARITY_ORDER: Record<string, number> = {
  "BPC-157":                                      2,
  "BPC-157 + TB-500":                              3,
  "T1rz":                                         4,
  "Trz- dual receptor":                           4,
  "Dual Receptor (T)":                            4,
  "R3ta":                                         0,
  "Rta - triple agonist":                         0,
  "triple agonist (R)":                           0,
  "Triple Agonist (R)":                           0,
  "GLP-TRZ":                                      4,
  "GLP-RT":                                       0,
  "AC2T":                                         4,
  "AC3R":                                         0,
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
  "Research Bundles",
];

function slugifyProductName(name: string): string {
  return SLUG_MAP[name] ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const FALLBACK_PRODUCTS: ProductCard[] = [
  { id: 332, name: "BPC-157", category: "Repair & Recovery Research", description: "Body Protection Compound — a pentadecapeptide with notable tissue healing and regenerative properties under research conditions.", price: "$59", purity: "99.4%", badge: "High Demand", badgeColor: "bg-indigo-600/70 text-indigo-100 border-indigo-500/50", icon: "⬡", permalink: "https://anvilcompounds.shop/product/bpc-157/", image: "/products/bpc157.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 447, name: "BPC-157 + TB-500", category: "Repair & Recovery Research", description: "Dual peptide recovery blend combining BPC-157 and TB-500 — studied for synergistic effects in tissue repair and cell migration research models.", price: "$79", originalPrice: "$89", purity: "99%+", badge: "Exclusive Blend", badgeColor: "bg-purple-600/70 text-purple-100 border-purple-500/50", icon: "⬧", permalink: "https://anvilcompounds.shop/product/bpc-157-tb-500/", image: "/products/wolverine.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 333, name: "AC2T", category: "Metabolic Research", description: "A dual incretin receptor agonist binding both GIP and GLP-1 receptors, under active clinical research.", price: "$79", originalPrice: "$89", purity: "99.1%", badge: "Dual Agonist", badgeColor: "bg-cyan-600/70 text-cyan-100 border-cyan-500/50", icon: "◇", permalink: "https://anvilcompounds.shop/product/ac2t/", image: "/products/glp-trz.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 337, name: "AC3R", category: "Metabolic Research", description: "A triple receptor agonist targeting GIP, GLP-1, and glucagon receptors — at the frontier of current metabolic research.", price: "$89", originalPrice: "$99", purity: "99.0%", badge: "Triple Agonist", badgeColor: "bg-rose-600/70 text-rose-100 border-rose-500/50", icon: "⬟", permalink: "https://anvilcompounds.shop/product/ac3r/", image: "/products/glp-rt.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 335, name: "KLOW", category: "Longevity & Cosmetic Research", description: "A curated blend of four research-grade peptides, independently tested as a combined formulation.", price: "$109", originalPrice: "$119", purity: "99.3%", badge: "Premium Blend", badgeColor: "bg-fuchsia-600/70 text-fuchsia-100 border-fuchsia-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/klow/", image: "/products/klow.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 354, name: "TB-500", category: "Repair & Recovery Research", description: "Synthetic analogue of Thymosin Beta-4, studied in cell migration, actin dynamics, and tissue modeling research models.", price: "$69", purity: "99%+", badge: "Recovery Staple", badgeColor: "bg-amber-600/70 text-amber-100 border-amber-500/50", icon: "◉", permalink: "https://anvilcompounds.shop/product/tb-500/", image: "/products/tb500.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 336, name: "GHK-Cu", category: "Longevity & Cosmetic Research", description: "A naturally occurring copper complex with extensive research into cellular remodeling and tissue response.", price: "$49", originalPrice: "$59", purity: "99.5%", badge: "Entry Point", badgeColor: "bg-teal-600/70 text-teal-100 border-teal-500/50", icon: "⬢", permalink: "https://anvilcompounds.shop/product/ghk-cu/", image: "/products/ghkcu.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 346, name: "MOTS-c", category: "Metabolic Research", description: "Mitochondrial-derived peptide studied in mitochondrial-nuclear communication, glucose metabolism, and cellular stress response.", price: "$59", purity: "99%+", badge: "Metabolic", badgeColor: "bg-violet-600/70 text-violet-100 border-violet-500/50", icon: "⬥", permalink: "https://anvilcompounds.shop/product/mots-c/", image: "/products/motsc.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 443, name: "NAD+", category: "Metabolic Research", description: "Coenzyme central to cellular energy metabolism and redox reactions, studied in mitochondrial and aging research models.", price: "$64", purity: "99%+", badge: "Cellular Energy", badgeColor: "bg-emerald-600/70 text-emerald-100 border-emerald-500/50", icon: "◇", permalink: "https://anvilcompounds.shop/product/nad-plus/", image: "/products/nad.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 446, name: "CJC-1295 + Ipamorelin", category: "Growth Pathway Research", description: "Combined growth-hormone secretagogue blend, studied for synergistic effects on GH pulsatility research models.", price: "$63", originalPrice: "$73", purity: "99%+", badge: "GH Blend", badgeColor: "bg-orange-600/70 text-orange-100 border-orange-500/50", icon: "⬧", permalink: "https://anvilcompounds.shop/product/cjc-1295-ipamorelin/", image: "/products/cjcipa.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 445, name: "Tesamorelin", category: "Growth Pathway Research", description: "Synthetic GHRH analogue studied in research involving growth hormone axis regulation.", price: "$79", purity: "99%+", badge: "GHRH Research", badgeColor: "bg-yellow-600/70 text-yellow-100 border-yellow-500/50", icon: "⬟", permalink: "https://anvilcompounds.shop/product/tesamorelin/", image: "/products/tesa.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 450, name: "5-Amino-1MQ", category: "Metabolic Research", description: "Small-molecule NNMT inhibitor studied in research involving cellular metabolism and adipocyte models.", price: "$50", purity: "99%+", badge: "Metabolic Support", badgeColor: "bg-lime-600/70 text-lime-100 border-lime-500/50", icon: "⬥", permalink: "https://anvilcompounds.shop/product/5-amino-1mq/", image: "/products/5amino.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 449, name: "GLOW", category: "Longevity & Cosmetic Research", description: "A curated cosmetic-research peptide blend, independently tested as a combined formulation.", price: "$109", purity: "99%+", badge: "Cosmetic Blend", badgeColor: "bg-pink-600/70 text-pink-100 border-pink-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/glow/", image: "/products/glow.jpg", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 510, name: "Semax", category: "Cognitive Research", description: "Synthetic heptapeptide analogue of ACTH(4-10), studied in research involving neurotrophic factor expression, BDNF signaling, and neuroprotective pathway models.", price: "$54", purity: "99%+", badge: "Neuropeptide", badgeColor: "bg-blue-600/70 text-blue-100 border-blue-500/50", icon: "◈", permalink: "https://anvilcompounds.shop/product/semax/", image: "https://anvilcompounds.shop/wp-content/uploads/2026/07/semaxproductphoto.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 511, name: "Selank", category: "Cognitive Research", description: "Synthetic heptapeptide analogue of tuftsin, studied in research involving GABAergic pathway modulation, neuropeptide signaling, and anxiety response models.", price: "$54", purity: "99%+", badge: "Anxiolytic Research", badgeColor: "bg-sky-600/70 text-sky-100 border-sky-500/50", icon: "◉", permalink: "https://anvilcompounds.shop/product/selank/", image: "https://anvilcompounds.shop/wp-content/uploads/2026/07/selankproductphoto.png", hasCoa: false, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 349, name: "Bacteriostatic Water", category: "Research Supplies", description: "0.9% benzyl alcohol sterile water. Standard reconstitution solvent for lyophilized peptide research. 3mL multi-use vial.", price: "$9", purity: "Sterility Certified", badge: "Essential Supply", badgeColor: "bg-slate-600/70 text-slate-100 border-slate-500/50", icon: "◎", permalink: "https://anvilcompounds.shop/product/bac-water/", image: null, hasCoa: true, coaApplicable: false, sizes: [], documentationFile: null, documentationImage: null },
  { id: 1041, name: "Energy Research Bundle", category: "Research Bundles", description: "MOTS-C 10mg + NAD+ 500mg, bundled and individually vialed.", price: "$105", purity: "99%+", badge: "Bundle Deal", badgeColor: "bg-green-600/70 text-green-100 border-green-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/energy-research-bundle/", image: "/products/energy-bundle.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 1043, name: "GHRH Bundle", category: "Research Bundles", description: "Retatrutide 10mg + CJC-1295/Ipamorelin 5+5mg, bundled and individually vialed.", price: "$130", purity: "99%+", badge: "Bundle Deal", badgeColor: "bg-green-600/70 text-green-100 border-green-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/ghrh-bundle/", image: "/products/ghrh-bundle.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 1045, name: "Metabolic Research Bundle", category: "Research Bundles", description: "MOTS-C 10mg + Retatrutide 10mg, bundled and individually vialed.", price: "$125", purity: "99%+", badge: "Bundle Deal", badgeColor: "bg-green-600/70 text-green-100 border-green-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/metabolic-research-bundle/", image: "/products/metabolic-bundle.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 1047, name: "Full Research Bundle", category: "Research Bundles", description: "Retatrutide + NAD+ + CJC-1295/Ipamorelin + GHK-Cu, bundled and individually vialed.", price: "$240", purity: "99%+", badge: "Bundle Deal", badgeColor: "bg-green-600/70 text-green-100 border-green-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/full-research-bundle/", image: "/products/full-bundle.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
  { id: 1049, name: "Cognitive Research Bundle", category: "Research Bundles", description: "Semax 10mg + Selank 10mg, bundled and individually vialed.", price: "$90", purity: "99%+", badge: "Bundle Deal", badgeColor: "bg-green-600/70 text-green-100 border-green-500/50", icon: "✦", permalink: "https://anvilcompounds.shop/product/cognitive-research-bundle/", image: "/products/cognitive-bundle.jpg", hasCoa: true, coaApplicable: true, sizes: [], documentationFile: null, documentationImage: null },
];

export function ProductCard({ product, index }: { product: ProductCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { addItem, openCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [coaOpen, setCoaOpen] = useState(false);

  // GLP compounds are inquiry-gated: guests can't view, add to cart, or
  // check the COA from the catalog card until they log in. Same
  // /account?redirect= pattern used for the GLP COA gate elsewhere.
  const glpGated = isLoginGatedCompound(product.name) && !isAuthenticated;
  const loginHref = `/account?redirect=${encodeURIComponent(`/products/${slugifyProductName(product.name)}`)}`;

  // Research Bundles are marked out of stock — display and functionally
  // blocked from purchase (see BUNDLE_PRODUCT_IDS in lib/bogoDiscount.ts;
  // also enforced server-side in app/api/checkout/place-order).
  const isBundleOOS = BUNDLE_PRODUCT_IDS.has(product.id);

  // BOGO-eligible cards show the effective per-vial price under B1G1 —
  // Base (regular_price, the crossed-out "was" price) halved, since a B1G1
  // pair always totals exactly the Base price (lib/bogoDiscount.ts) — NOT
  // the single/current price halved, which would be a different, smaller
  // number now that Base and Single are two distinct WC price fields.
  // Bundles/BAC water (BOGO_EXCLUDED_PRODUCT_IDS) keep showing their real price.
  const isBogoEligible = BOGO_ENABLED && !BOGO_EXCLUDED_PRODUCT_IDS.has(product.id);
  const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0;
  const regularPriceNum = product.originalPrice
    ? parseFloat(product.originalPrice.replace(/[^0-9.]/g, "")) || priceNum
    : priceNum;
  const bogoUnitPrice = regularPriceNum > 0 ? `$${(regularPriceNum / 2).toFixed(2)}` : product.price;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // BOGO-eligible products always add as a pair — 2nd vial free, applied
    // automatically at checkout (see lib/bogoDiscount.ts) — so there's no
    // "buy just 1" path from the catalog card's one-click add either.
    const bogoQty = BOGO_ENABLED && !BOGO_EXCLUDED_PRODUCT_IDS.has(product.id) ? 2 : 1;
    addItem({
      slug: slugifyProductName(product.name),
      name: product.name,
      size: "Standard",
      price: priceNum,
      regularPrice: regularPriceNum,
      wcProductId: product.id,
    }, bogoQty);
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [product, priceNum, regularPriceNum, addItem, openCart]);

  const productHref = glpGated ? loginHref : `/products/${slugifyProductName(product.name)}`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      {/* Outer card is a plain div, NOT a Link/anchor — the card contains
          real <button> elements (Add to Cart, View COA), and a <button>
          nested inside an <a> is invalid HTML that mobile Safari in
          particular handles unreliably (stopPropagation() on the button
          doesn't consistently suppress the anchor's own navigation, which
          was causing "View COA" to both open the modal AND navigate to the
          product page, then leaving a broken back-button history entry).
          The clickable-to-navigate region (image + title/purity) is wrapped
          in its own <Link> below with display:contents so it prefetches
          without introducing an extra box in the flex layout; the
          price/buttons row is a separate sibling, outside any anchor. */}
      <div className="bg-white border border-mock-line rounded-xl overflow-hidden h-full flex flex-col transition-all duration-500 hover:border-mock-cobalt/40 hover:shadow-xl hover:shadow-mock-cobalt/10 hover:-translate-y-1">

        <Link href={productHref} className="contents">

        {/* Product image -- container aspect matches the source photos
            (1195x1600, the Aug 2026 photo refresh) so object-contain fills
            it edge-to-edge with no forced zoom and no letterboxed gap,
            guaranteeing the full frame (vial + info card) is always visible
            instead of being center-cropped. */}
        <div className="relative w-full aspect-[1195/1600] bg-white overflow-hidden shrink-0 cursor-pointer">
          {product.image ? (
            <div className="absolute inset-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl text-mock-cobalt/30">{product.icon}</span>
            </div>
          )}
          {/* Badge overlay */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className={`text-xs font-mono tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm ${product.badgeColor}`}>
              {product.badge}
            </span>
          </div>
          {BOGO_ENABLED && (
            <div className="absolute bottom-2.5 right-2.5 z-20">
              <span className="text-xs font-display font-700 tracking-wide px-2 py-0.5 rounded-full bg-mock-cobalt text-white shadow-md">
                🎁 BOGO
              </span>
            </div>
          )}
          {/* COA-pending blur overlay */}
          {!product.hasCoa ? (
            <div className="absolute inset-0 z-10 backdrop-blur-md bg-mock-graphite/95 flex flex-col items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="font-mono text-[10px] text-yellow-300 tracking-[0.18em] uppercase text-center px-2">
                Testing in Progress
              </span>
            </div>
          ) : glpGated ? (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-mock-graphite/70 flex flex-col items-center justify-center gap-2">
              <svg className="w-4 h-4 text-mock-cobaltLight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-mono text-[10px] text-mock-cobaltLight tracking-[0.18em] uppercase text-center px-2">
                Sign Up to Inquire
              </span>
            </div>
          ) : isBundleOOS ? (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-mock-graphite/80 flex flex-col items-center justify-center gap-2">
              <span className="font-mono text-[10px] text-red-300 tracking-[0.18em] uppercase text-center px-2">
                Out of Stock
              </span>
            </div>
          ) : null}
        </div>

        {/* Card content — title/category + purity, still inside the Link
            (clicking anywhere here navigates). flex-grow here (not on the
            price/buttons block below) keeps equal-height cards in a row
            even when titles wrap differently, same as before the split. */}
        <div className="px-3 md:px-4 pt-3 md:pt-4 flex flex-col flex-grow cursor-pointer">
          <div className="mb-2.5 md:mb-3">
            <h3 className="font-display font-700 text-base md:text-xl text-mock-navy mb-0.5 leading-tight">
              {getProductDisplayTitle(product.name, product.category)}
            </h3>
            {getCompoundReveal(product.name) && (
              <div className="mb-1">
                <CompoundRevealBadge compound={getCompoundReveal(product.name)!} size="md" />
              </div>
            )}
            <span className="font-mono text-[10px] md:text-xs text-mock-cobaltInk/70 tracking-widest uppercase">
              {product.category}
            </span>
          </div>

          {/* Purity bar */}
          <div className="mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9px] md:text-xs text-mock-sub tracking-widest uppercase">Verified Purity</span>
              <span className="font-mono text-[10px] md:text-xs text-mock-cobaltInk font-500">{product.purity}</span>
            </div>
            <div className="h-0.5 md:h-1 w-full bg-mock-line rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: product.purity } : {}}
                transition={{ duration: 1.2, delay: index * 0.08 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-mock-cobalt to-mock-cobaltLight rounded-full"
              />
            </div>
          </div>
        </div>
        </Link>

        {/* Price + buttons — deliberately outside the Link (real <button>s
            live here: Add to Cart, View COA). See the note on the outer
            card div above for why. */}
        <div className="px-3 md:px-4 pb-3 md:pb-4 pt-2.5 md:pt-3.5 border-t border-mock-line">
          <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
            <div>
              <span className="font-mono text-[9px] md:text-xs text-mock-sub block tracking-wider">From</span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-display font-800 text-lg md:text-2xl text-mock-navy">
                  {isBogoEligible ? bogoUnitPrice : product.price}
                </span>
                {isBogoEligible ? (
                  <span className="font-mono text-[10px] md:text-xs text-green-700 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                    with B1G1
                  </span>
                ) : product.originalPrice && (
                  <span className="font-body text-xs md:text-sm text-mock-sub line-through">{product.originalPrice}</span>
                )}
              </div>
              {isBundleOOS ? (
                <span className="font-mono text-[10px] md:text-xs text-red-600 font-600">
                  Out of stock
                </span>
              ) : product.stockQuantity != null && product.stockQuantity < 5 && (
                <span className="font-mono text-[10px] md:text-xs text-amber-600 font-600">
                  {product.stockQuantity <= 0 ? "Out of stock" : "Limited qty."}
                </span>
              )}
            </div>

            {/* mg/size options — shown next to the price for every product
                that has size data, whether it's a single fixed mg or
                multiple variations (e.g. GHK-Cu's 50mg/100mg). Skipped for
                bundles: their one "variation" is a composite dose string
                (e.g. "10mg MOTS-C + 500mg NAD+") that isn't a real size
                choice and just reads as clutter next to the price. */}
            {product.sizes.length > 0 && product.category !== "Research Bundles" && (
              <div className="flex flex-wrap gap-1.5 justify-end">
                {product.sizes.map((size) => (
                  <span
                    key={size}
                    className="px-2 py-0.5 rounded-md border border-mock-line bg-mock-surface2 font-mono text-[10px] text-mock-sub whitespace-nowrap"
                  >
                    {simplifySizeLabel(size)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1.5 md:gap-2">
            {product.coaApplicable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (glpGated) { router.push(loginHref); return; }
                  setCoaOpen(true);
                }}
                className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 bg-mock-surface2 hover:bg-mock-line/60 border border-mock-line hover:border-mock-cobalt/30 text-mock-sub hover:text-mock-navy text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300"
              >
                View COA
              </button>
            )}
            {glpGated ? (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(loginHref); }}
                className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 border border-mock-cobalt/40 bg-mock-cobalt/10 hover:bg-mock-cobalt/20 text-mock-cobaltInk hover:text-mock-cobalt text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300"
              >
                Sign Up to Inquire
              </button>
            ) : isBundleOOS ? (
              <span className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 border border-red-500/30 bg-red-500/10 text-red-700 text-[10px] md:text-xs font-mono rounded-lg cursor-default">
                Out of Stock
              </span>
            ) : product.hasCoa ? (
              <button
                onClick={handleAddToCart}
                className={`flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 border text-xs md:text-sm font-display font-600 rounded-lg transition-all duration-300 ${
                  added
                    ? "bg-green-600/20 border-green-500/40 text-green-700"
                    : "bg-mock-cobalt/10 hover:bg-mock-cobalt border-mock-cobalt/30 hover:border-mock-cobaltInk text-mock-cobaltInk hover:text-white"
                }`}
              >
                {added ? "✓ Added" : "Add to Cart"}
              </button>
            ) : (
              <span className="flex-1 text-center px-2 md:px-3 py-1.5 md:py-2 border border-yellow-500/30 bg-yellow-500/10 text-yellow-700 text-[10px] md:text-xs font-mono rounded-lg cursor-default">
                Testing in Progress
              </span>
            )}
          </div>
        </div>
      </div>

      <CoaModal
        open={coaOpen}
        onClose={() => setCoaOpen(false)}
        title={product.name}
        imageUrl={product.documentationImage}
        fileUrl={product.documentationFile}
      />
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-mock-line rounded-xl overflow-hidden animate-pulse">
      <div className="w-full aspect-[1195/1600] bg-mock-surface2" />
      <div className="p-3 md:p-4 space-y-2 md:space-y-3">
        <div className="w-1/2 h-4 md:h-5 bg-mock-surface2 rounded" />
        <div className="w-1/3 h-2.5 md:h-3 bg-mock-surface2 rounded" />
        <div className="pt-2.5 md:pt-3.5 space-y-2">
          <div className="w-full h-1 bg-mock-surface2 rounded" />
          <div className="w-2/3 h-6 bg-mock-surface2 rounded" />
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
  const searchParams = useSearchParams();
  // Deep-link support for e.g. the homepage BundlesTeaser's "Browse All
  // Bundles" CTA (?category=Research+Bundles) — falls back to "All
  // Compounds" for a plain /catalog visit, same as before.
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get("category") || "All Compounds"
  );
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

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

  // "Live" = has a COA and isn't login-gated. This is a catalog-merchandising
  // property (independent of whether the *current viewer* happens to be
  // logged in), so gating is checked statically via isLoginGatedCompound
  // rather than the glpGated/isAuthenticated flag used for card-level UI.
  const isLive = (p: ProductCard) => p.hasCoa && !isLoginGatedCompound(p.name);

  const byPopularity = (a: ProductCard, b: ProductCard) => {
    // Bundles always sort after every individual compound, regardless of
    // category tab or leading-row/popularity rank — per the catalog spec,
    // bundle cards live below the single-compound cards, never mixed in.
    const bundleA = a.category === "Research Bundles" ? 1 : 0;
    const bundleB = b.category === "Research Bundles" ? 1 : 0;
    if (bundleA !== bundleB) return bundleA - bundleB;

    // Leading row is pinned regardless of the live/gated + popularity sort
    // below — everything else keeps its existing relative order.
    const leadA = LEADING_ROW_ORDER[a.name];
    const leadB = LEADING_ROW_ORDER[b.name];
    if (leadA !== undefined || leadB !== undefined) {
      if (leadA !== undefined && leadB !== undefined) return leadA - leadB;
      return leadA !== undefined ? -1 : 1;
    }
    const liveA = isLive(a) ? 0 : 1;
    const liveB = isLive(b) ? 0 : 1;
    if (liveA !== liveB) return liveA - liveB;
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
    <section id="catalog" className="relative bg-mock-page py-24 md:py-32">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="hidden md:flex flex-wrap items-center gap-2.5 mb-6"
          >
            {CATALOG_TRUST_BADGES.map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mock-line bg-white"
              >
                <span className="text-mock-cobaltInk shrink-0">{badge.icon}</span>
                <span className="font-mono text-[11px] text-mock-sub tracking-wide whitespace-nowrap">
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
            <div className="w-6 h-px bg-mock-cobalt" />
            <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.25em] uppercase">
              002 / Research Catalog
            </span>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={headerInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-heading font-700 text-mock-navy"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
              >
                <span>Research Catalog</span>
              </motion.h2>
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mock-sub"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-mock-line focus:border-mock-cobalt/50 rounded-lg text-mock-navy placeholder-mock-sub font-body text-sm outline-none transition-all duration-300"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mock-sub hover:text-mock-navy transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Category filter — one collapsible dropdown at every screen size
            (desktop used to keep an always-expanded pill row, but that
            wraps across multiple lines now that there are 8 categories;
            a single toggle stays clean regardless of how many get added
            later). Full-width on mobile, a fixed comfortable width on
            desktop so it doesn't stretch edge-to-edge on a wide screen. */}
        {!loading && categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-6 relative w-full md:w-80"
          >
            <button
              onClick={() => setCategoryMenuOpen((o) => !o)}
              aria-expanded={categoryMenuOpen}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-mock-cobalt/25 bg-mock-cobalt/10 text-mock-cobaltInk hover:bg-mock-cobalt/15 transition-colors"
            >
              <span className="flex items-center gap-2.5 font-mono text-xs tracking-wide">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {selectedCategory}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${categoryMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {categoryMenuOpen && (
              <div className="absolute z-30 mt-1.5 w-full rounded-lg border border-mock-line bg-white shadow-xl overflow-hidden">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setMobileShowAll(false);
                        setRevealedViaClick(false);
                        setCategoryMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 font-mono text-xs tracking-wide border-b border-mock-line last:border-0 transition-colors ${
                        isActive
                          ? "bg-mock-cobalt text-white"
                          : "text-mock-sub hover:bg-mock-surface2 hover:text-mock-navy"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
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
                <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-16 text-mock-sub font-body">
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
              className="px-8 py-3 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30"
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
              className="px-8 py-3 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30"
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
          className="mt-10 text-center font-mono text-xs text-mock-sub tracking-wide"
        >
          All products are for in vitro laboratory and research use only. Must be 21+ to purchase.
          Not intended for human or veterinary use.
        </motion.p>
      </div>
    </section>
  );
}
