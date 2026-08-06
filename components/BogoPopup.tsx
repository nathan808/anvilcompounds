"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { BOGO_ENABLED } from "@/lib/bogoDiscount";

const SHOW_AFTER_MS = 5000;
const SEEN_KEY = "anvil_bogo_popup_seen";

// AgeGate.tsx sits at z-[999] and blocks the whole page until dismissed —
// replicates its own storage check so the 5s countdown only starts once
// it's actually gone. Without this, a slow-to-confirm visitor could have
// the popup fire (and burn its one-time-ever localStorage flag) silently
// behind the gate, never seeing it.
function isAgeGateBlocking(): boolean {
  if (sessionStorage.getItem("anvil_age_verified")) return false;
  const stored = localStorage.getItem("anvil_age_verified");
  if (stored) {
    try {
      const { expires } = JSON.parse(stored);
      if (Date.now() < expires) return false;
    } catch {
      // fall through — treat as blocking
    }
  }
  return true;
}

// Same baked-in "Shop Now" position, as a % of the image's own box, as the
// promo banner used previously — still valid here since the modal preserves
// the image's exact aspect ratio (object-contain, nothing cropped).
const SHOP_NOW_HOTSPOT = {
  desktop: { left: "3.4%", top: "60.7%", width: "21.5%", height: "7.5%" },
  mobile: { left: "8.1%", top: "76%", width: "83.6%", height: "8.2%" },
};

const SECONDARY_ROW = {
  desktop: { left: "3.4%", top: "70.5%", width: "auto" },
  mobile: { left: "8.1%", top: "86.5%", width: "83.6%" },
};

const SECONDARY_CTAS = [
  { label: "View COAs →", href: "/coas" },
  { label: "Our Testing Process →", href: "#testing" },
];

function ExploreCatalogHotspot({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate: () => void }) {
  const pos = SHOP_NOW_HOTSPOT[variant];
  return (
    <a
      href="/catalog?catalog=full"
      aria-label="Explore Catalog"
      onClick={onNavigate}
      className="absolute flex items-center justify-center bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 tracking-wide rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/30"
      style={{
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: pos.height,
        fontSize: "clamp(9px, 1.9vw, 16px)",
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
        padding: "0 2px",
      }}
    >
      Explore Catalog
    </a>
  );
}

function SecondaryCtaRow({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate: () => void }) {
  const pos = SECONDARY_ROW[variant];
  return (
    <div className="absolute flex items-center gap-1.5" style={{ left: pos.left, top: pos.top, width: pos.width }}>
      {SECONDARY_CTAS.map((cta) => (
        <a
          key={cta.label}
          href={cta.href}
          onClick={onNavigate}
          className="px-2.5 py-1 rounded bg-white/75 hover:bg-white border border-mock-line/70 backdrop-blur-sm text-mock-cobaltInk hover:text-mock-cobalt font-display font-600 tracking-wide transition-all duration-300 whitespace-nowrap"
          style={{ fontSize: "clamp(7px, 1.35vw, 12px)" }}
        >
          {cta.label}
        </a>
      ))}
    </div>
  );
}

export default function BogoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!BOGO_ENABLED) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;

    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout> | undefined;

    const startCountdown = () => {
      showTimer = setTimeout(() => {
        if (cancelled) return;
        setOpen(true);
        localStorage.setItem(SEEN_KEY, "1");
      }, SHOW_AFTER_MS);
    };

    if (!isAgeGateBlocking()) {
      startCountdown();
      return () => {
        cancelled = true;
        if (showTimer) clearTimeout(showTimer);
      };
    }

    const poll = setInterval(() => {
      if (!isAgeGateBlocking()) {
        clearInterval(poll);
        startCountdown();
      }
    }, 300);
    return () => {
      cancelled = true;
      clearInterval(poll);
      if (showTimer) clearTimeout(showTimer);
    };
  }, []);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-mock-line backdrop-blur-sm flex items-center justify-center text-mock-navy transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Desktop art */}
            <div className="hidden md:block relative w-full" style={{ aspectRatio: "1920 / 1071" }}>
              <Image
                src="/images/homepage/banner-b1g1-desktop.jpg"
                alt="Buy one vial, get the second free — every 2nd matching vial free, automatic at checkout, plus free bacteriostatic water with every pair"
                fill
                className="object-contain"
                sizes="(min-width: 768px) 576px"
              />
              <ExploreCatalogHotspot variant="desktop" onNavigate={close} />
              <SecondaryCtaRow variant="desktop" onNavigate={close} />
            </div>

            {/* Mobile art */}
            <div className="md:hidden relative w-full" style={{ aspectRatio: "1080 / 1395" }}>
              <Image
                src="/images/homepage/banner-b1g1-mobile.jpg"
                alt="Buy one vial, get the second free — every 2nd matching vial free, automatic at checkout, plus free bacteriostatic water with every pair"
                fill
                className="object-contain"
                sizes="90vw"
              />
              <ExploreCatalogHotspot variant="mobile" onNavigate={close} />
              <SecondaryCtaRow variant="mobile" onNavigate={close} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
