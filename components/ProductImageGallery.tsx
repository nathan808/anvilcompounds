"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  src: string;
  alt: string;
  label: string;
}

interface ProductImageGalleryProps {
  productImage?: string | null;
  productName: string;
  coaImage?: string | null;
  // "boxed" (default) = framed square card, used in the mobile flow.
  // "bleed" = edge-to-edge, no border/radius, fills the column height —
  // matches the FeaturedSpotlight band's visual language for the desktop
  // PDP hero (see components/FeaturedSpotlight.tsx).
  variant?: "boxed" | "bleed";
}

export default function ProductImageGallery({ productImage, productName, coaImage, variant = "boxed" }: ProductImageGalleryProps) {
  const images: GalleryImage[] = [];
  if (productImage) images.push({ src: productImage, alt: productName, label: "Product" });
  if (coaImage) images.push({ src: coaImage, alt: `${productName} Certificate of Analysis`, label: "COA" });

  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="bg-white border border-mock-line rounded-2xl flex items-center justify-center max-w-lg mx-auto lg:max-w-none"
        style={{ minHeight: "420px" }}
      >
        <span className="text-mock-cobalt/20 select-none" style={{ fontSize: "6rem", lineHeight: 1 }}>
          ⬡
        </span>
      </div>
    );
  }

  const current = images[index];
  const showNav = images.length > 1;
  const bleed = variant === "bleed";

  return (
    <div className={bleed ? "relative h-full" : "relative"}>
      <div
        className={
          bleed
            ? "relative w-full h-full min-h-[420px] lg:min-h-[560px] rounded-2xl overflow-hidden"
            : "relative w-full aspect-square max-w-lg mx-auto lg:max-w-none rounded-2xl overflow-hidden bg-white border border-mock-line"
        }
      >
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className={bleed ? "object-cover object-left" : "object-cover"}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {showNav && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-mock-graphite/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-mock-graphite/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-mock-graphite/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-mock-graphite/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {images.map((img, i) => (
                <button
                  key={img.label}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${img.label} image`}
                  className={`px-2.5 py-1 rounded-full font-mono text-[9px] tracking-widest uppercase transition-colors ${
                    i === index
                      ? "bg-mock-cobalt text-white"
                      : "bg-mock-graphite/70 text-white/50 hover:text-white/80"
                  }`}
                >
                  {img.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
