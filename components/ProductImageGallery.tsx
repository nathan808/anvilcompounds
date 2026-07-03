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
}

export default function ProductImageGallery({ productImage, productName, coaImage }: ProductImageGalleryProps) {
  const images: GalleryImage[] = [];
  if (productImage) images.push({ src: productImage, alt: productName, label: "Product" });
  if (coaImage) images.push({ src: coaImage, alt: `${productName} Certificate of Analysis`, label: "COA" });

  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="glass-card rounded-2xl flex items-center justify-center max-w-lg mx-auto lg:max-w-none"
        style={{ minHeight: "420px" }}
      >
        <span className="text-blue-400/20 select-none" style={{ fontSize: "6rem", lineHeight: 1 }}>
          ⬡
        </span>
      </div>
    );
  }

  const current = images[index];
  const showNav = images.length > 1;

  return (
    <div className="relative">
      <div className="relative w-full aspect-square max-w-lg mx-auto lg:max-w-none rounded-2xl overflow-hidden glass-card">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {showNav && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-950/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-navy-950/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-950/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-navy-950/80 transition-colors"
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
                      ? "bg-blue-600 text-white"
                      : "bg-navy-950/60 text-white/50 hover:text-white/80"
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
