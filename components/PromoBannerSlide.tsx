"use client";

import Image from "next/image";

// Precise position of the baked-in "Shop Now" button inside each source
// image, as a % of the image's OWN rendered box (not the outer slide) —
// sampled from the source art. Covered with a real "Explore Catalog"
// button in matching brand blue so it reads as one seamless button.
// Widened/heightened somewhat past the original baked-in "Shop Now" graphic's
// exact bounds (which was sized for its own short label) — "Explore Catalog"
// is a longer label and needs the extra room to stay legible at the hero's
// reverted (much smaller) size. Still anchored to the same top-left corner.
const SHOP_NOW_HOTSPOT = {
  desktop: { left: "3.4%", top: "60.7%", width: "21.5%", height: "7.5%" },
  // Mobile source had its top 105px (a baked-in "Anvil Compounds" wordmark,
  // redundant with the real navbar above it) cropped off. Percentages below
  // are relative to that cropped 1080x1395 image, not the original 1080x1500.
  mobile: { left: "8.1%", top: "76%", width: "83.6%", height: "8.2%" },
};

// The art wasn't designed with 3 buttons in mind — only "Explore Catalog"
// has a natural home. These two sit as a smaller, secondary pill row in the
// empty light-blue space between it and the compliance text at the bottom.
const SECONDARY_ROW = {
  desktop: { left: "3.95%", top: "73.5%", width: "auto" },
  mobile: { left: "8.1%", top: "86.5%", width: "83.6%" },
};

const SECONDARY_CTAS = [
  { label: "View COAs →", href: "/coas" },
  { label: "Our Testing Process →", href: "#testing" },
];

// Fixed navbar (64px) + BOGO announcement bar (36px) = 100px stack, measured
// directly (same on both breakpoints — navbar height doesn't change), plus a
// little breathing room so nothing sits flush against it.
const NAV_CLEARANCE = { mobile: 108, desktop: 108 };

// Sampled directly from each source image's own background (corners/edges,
// away from the vials and text) — a real blurred copy of the art was tried
// first, but blurring a region that includes dark headline text and vial
// caps averages toward a muddy gray, not the image's actual light blue.
// A gradient built from the true sampled colors blends seamlessly instead.
const FILL_GRADIENT = {
  desktop: "radial-gradient(ellipse 90% 80% at 50% 15%, #EEF6FC 0%, #D8E9F5 100%)",
  mobile: "linear-gradient(180deg, #E9F1FA 0%, #D7E5F5 100%)",
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
        fontSize: "clamp(7px, 1.7vh, 12.5px)",
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
        padding: "0 2px",
      }}
    >
      Explore Catalog
    </a>
  );
}

function SecondaryCtaRow({ variant }: { variant: "desktop" | "mobile" }) {
  const pos = SECONDARY_ROW[variant];
  return (
    <div
      className="absolute flex items-center gap-1.5"
      style={{ left: pos.left, top: pos.top, width: pos.width }}
    >
      {SECONDARY_CTAS.map((cta) => (
        <a
          key={cta.label}
          href={cta.href}
          className="px-1.5 py-0.5 rounded bg-white/75 hover:bg-white border border-mock-line/70 backdrop-blur-sm text-mock-cobaltInk hover:text-mock-cobalt font-display font-600 tracking-wide transition-all duration-300 whitespace-nowrap"
          style={{ fontSize: "clamp(5px, 1.15vh, 10px)" }}
        >
          {cta.label}
        </a>
      ))}
    </div>
  );
}

function BannerArt({
  variant,
  src,
  aspect,
}: {
  variant: "desktop" | "mobile";
  src: string;
  aspect: string;
}) {
  const clearance = NAV_CLEARANCE[variant];
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: FILL_GRADIENT[variant] }}>
      {/* Sharp, fully-intact art — sized by the available height (below the
          nav clearance) so nothing is ever cropped, centered horizontally. */}
      <div
        className="absolute left-0 right-0 bottom-0 flex items-center justify-center"
        style={{ top: clearance }}
      >
        <div className="relative h-full" style={{ aspectRatio: aspect }}>
          <Image
            src={src}
            alt="Buy one vial, get the second free — every 2nd matching vial free, automatic at checkout, plus free bacteriostatic water with every pair"
            fill
            className="object-contain"
            sizes={variant === "desktop" ? "(min-width: 768px) 60vh" : "70vh"}
            priority
          />
          <ExploreCatalogHotspot variant={variant} />
          <SecondaryCtaRow variant={variant} />
        </div>
      </div>
    </div>
  );
}

export default function PromoBannerSlide() {
  return (
    <div className="relative w-full h-full bg-[#EAF1FC]">
      <div className="hidden md:block w-full h-full">
        <BannerArt variant="desktop" src="/images/homepage/banner-b1g1-desktop.jpg" aspect="1920 / 1071" />
      </div>
      <div className="md:hidden w-full h-full">
        <BannerArt variant="mobile" src="/images/homepage/banner-b1g1-mobile.jpg" aspect="1080 / 1395" />
      </div>
    </div>
  );
}
