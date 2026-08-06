"use client";

import Image from "next/image";
import { BOGO_ENABLED } from "@/lib/bogoDiscount";

const CTA_BUTTONS = [
  {
    label: "Explore Catalog",
    href: "/catalog?catalog=full",
    className:
      "px-5 py-2 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30 text-center",
  },
  {
    label: "View COAs →",
    href: "/coas",
    className:
      "px-5 py-2 border border-mock-line hover:border-mock-cobalt text-mock-cobaltInk hover:text-mock-cobalt font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/60 hover:bg-white/90 text-center",
  },
  {
    label: "Our Testing Process →",
    href: "#testing",
    className:
      "px-5 py-2 border border-mock-line hover:border-mock-sub text-mock-sub hover:text-mock-ink font-display font-600 text-sm tracking-wide rounded-md transition-all duration-300 bg-white/60 hover:bg-white/90 text-center",
  },
];

// Precise position of the baked-in "Shop Now" button inside each source
// image, as a % of the image's own box — sampled from the source art, not
// arbitrary. Covered with a real "Explore Catalog" button in matching brand
// blue so it reads as one seamless button, not an overlay.
const SHOP_NOW_HOTSPOT = {
  desktop: { left: "3.95%", top: "61.65%", width: "13.8%", height: "5.6%" },
  // Mobile source image had its top 105px (a baked-in "Anvil Compounds"
  // wordmark, redundant with the real navbar above it) cropped off, leaving
  // "LIMITED TIME · BUY 1 GET 1 FREE" as the new top line. Percentages below
  // are relative to the cropped 1080x1395 image, not the original 1080x1500.
  mobile: { left: "8.1%", top: "76.9%", width: "83.6%", height: "6.8%" },
};

function ExploreCatalogHotspot({ variant }: { variant: "desktop" | "mobile" }) {
  const pos = SHOP_NOW_HOTSPOT[variant];
  return (
    <a
      href="/catalog?catalog=full"
      aria-label="Explore Catalog"
      className="absolute flex items-center justify-center bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30"
      style={{
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: pos.height,
        fontSize: "clamp(11px, 1.3vw, 17px)",
      }}
    >
      Explore Catalog
    </a>
  );
}

export default function PromoBannerSlide() {
  return (
    <div className="relative w-full h-full flex flex-col items-center py-6 md:py-8">
      {/* This slide sits beside HeroSection in the carousel row and starts
          at the very top of the flow same as it does, but doesn't have
          HeroSection's own pt-10/12 (tuned to clear a plain navbar) to build
          on top of — so this spacer covers the FULL fixed navbar + BOGO
          promo bar stack height itself, not just the promo bar's delta. */}
      {BOGO_ENABLED && <div className="h-[76px] md:h-[84px] shrink-0" />}

      {/* Desktop art */}
      <div className="hidden md:block relative w-full max-w-6xl mx-auto px-6">
        <div className="relative w-full aspect-[1920/1071]">
          <Image
            src="/images/homepage/banner-b1g1-desktop.jpg"
            alt="Buy one vial, get the second free — every 2nd matching vial free, automatic at checkout, plus free bacteriostatic water with every pair"
            fill
            className="object-contain"
            sizes="(min-width: 768px) 90vw, 0px"
            priority
          />
          <ExploreCatalogHotspot variant="desktop" />
        </div>
      </div>

      {/* Mobile art */}
      <div className="md:hidden relative w-full px-4">
        <div className="relative w-full aspect-[1080/1395]">
          <Image
            src="/images/homepage/banner-b1g1-mobile.jpg"
            alt="Buy one vial, get the second free — every 2nd matching vial free, automatic at checkout, plus free bacteriostatic water with every pair"
            fill
            className="object-contain"
            sizes="calc(100vw - 32px)"
            priority
          />
          <ExploreCatalogHotspot variant="mobile" />
        </div>
      </div>

      {/* Same CTA row as the hero slide */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 mt-4 px-4 w-full sm:w-auto">
        {CTA_BUTTONS.map((btn) => (
          <a key={btn.label} href={btn.href} className={btn.className}>
            {btn.label}
          </a>
        ))}
      </div>
    </div>
  );
}
