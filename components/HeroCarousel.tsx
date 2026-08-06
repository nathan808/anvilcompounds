"use client";

import { useEffect, useRef, useState } from "react";
import HeroSection from "@/components/HeroSection";
import PromoBannerSlide from "@/components/PromoBannerSlide";

const AUTO_ADVANCE_MS = 8000;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  // Auto-advance happens exactly once, hero -> promo. Any manual navigation
  // (even back to the hero) cancels it for good — it never fires again.
  const autoAdvanceDone = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!autoAdvanceDone.current) {
        autoAdvanceDone.current = true;
        setActive(1);
      }
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, []);

  const goTo = (i: number) => {
    autoAdvanceDone.current = true;
    setActive(i);
  };

  return (
    // Locked to the exact original hero height — both slides fit inside
    // this, nothing grows it. Matches HeroSection's own minHeight exactly,
    // so slide 1 renders identically to before the carousel existed.
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(344px, 46vh, 528px)" }}>
      <div
        className="flex items-stretch h-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: "200%", transform: `translateX(-${active * 50}%)` }}
      >
        <div className="w-1/2 h-full shrink-0">
          <HeroSection />
        </div>
        <div className="w-1/2 h-full shrink-0">
          <PromoBannerSlide />
        </div>
      </div>

      {/* Prev / next arrows */}
      <button
        type="button"
        onClick={() => goTo(active === 0 ? 1 : 0)}
        aria-label="Previous slide"
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/70 hover:bg-white border border-mock-line backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-sm"
      >
        <svg className="w-4 h-4 text-mock-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => goTo(active === 0 ? 1 : 0)}
        aria-label="Next slide"
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/70 hover:bg-white border border-mock-line backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-sm"
      >
        <svg className="w-4 h-4 text-mock-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              active === i ? "w-6 h-2 bg-mock-cobalt" : "w-2 h-2 bg-mock-navy/25 hover:bg-mock-navy/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
