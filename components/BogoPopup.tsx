"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { BOGO_ENABLED } from "@/lib/bogoDiscount";

const SHOW_AFTER_MS = 12000;
// sessionStorage (not localStorage) — the popup should reappear once per
// browser session (new tab/window or after the browser fully closes), not
// stay dismissed forever after the first time a visitor ever sees it.
const SEEN_KEY = "anvil_bogo_popup_seen";

// Only fires on Home, the COA library (+ its guide pages), and Learn — not
// cart/checkout/account/product pages, where a BOGO interruption is more
// likely to distract from a task the visitor's already mid-way through.
function isAllowedPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/learn" || pathname === "/coas" || pathname.startsWith("/coas/");
}

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

export default function BogoPopup() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!BOGO_ENABLED) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SEEN_KEY)) return;
    if (!isAllowedPath(pathname)) return;

    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout> | undefined;

    const startCountdown = () => {
      showTimer = setTimeout(() => {
        if (cancelled) return;
        setOpen(true);
        sessionStorage.setItem(SEEN_KEY, "1");
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
  }, [pathname]);

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
            className="relative w-full max-w-[490px] rounded-2xl overflow-hidden shadow-2xl"
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

            <div className="bg-white">
              {/* Single banner art — the "Shop now" call to action is baked into
                  the artwork itself, so the whole image is one link rather than
                  pairing it with a separate coded button underneath. */}
              <a
                href="/catalog?catalog=full"
                onClick={close}
                className="relative block w-full"
                style={{ aspectRatio: "1320 / 1656" }}
              >
                <Image
                  src="/images/homepage/banner-b1g1.jpg"
                  alt="Buy one, get one free — plus a free 3ml bacteriostatic water with every order, free USA shipping, ships same day. Shop now."
                  fill
                  className="object-contain"
                  sizes="(min-width: 768px) 490px, 90vw"
                />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
