"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";

interface Props {
  slug: string;
  name: string;
  sizes: string[];
  sizesPrices: number[];
  priceNumber: number;
  wcProductId: number;
}

export default function AddToCartButton({ slug, name, sizes, sizesPrices, priceNumber, wcProductId }: Props) {
  const { addItem, openCart } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const selectedSize = sizes[selectedIndex] ?? "";
  const selectedPrice = sizesPrices[selectedIndex] ?? priceNumber;

  const handleAdd = () => {
    addItem({ slug, name, size: selectedSize, price: selectedPrice, wcProductId });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  return (
    <div className="space-y-3">
      {/* Price — reactive to size selection */}
      <div className="pt-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-800 text-3xl text-white">
            ${selectedPrice.toFixed(2)}
          </span>
          <span className="font-body text-sm text-white/30">/ vial</span>
        </div>
      </div>

      {/* Size selector */}
      {sizes.length > 1 && (
        <div>
          <p className="font-mono text-xs text-white/40 tracking-widest uppercase mb-3">Select Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size, idx) => (
              <button
                key={size}
                onClick={() => setSelectedIndex(idx)}
                className={`px-5 py-2.5 rounded-lg border font-mono text-sm font-500 transition-all duration-200 ${
                  selectedIndex === idx
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Urgency */}
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-blue-600/8 border border-blue-600/15">
        <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-mono text-[10px] text-slate-400 tracking-wide">
          Order before <strong className="text-white/70">12PM PST</strong> for same-day dispatch
        </p>
      </div>

      {/* Main CTA */}
      <button
        onClick={handleAdd}
        className={`block w-full text-center py-4 font-display font-700 text-base rounded-xl transition-all duration-300 ${
          added
            ? "bg-green-600 text-white"
            : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
        }`}
      >
        {added ? "✓ Added to Order" : "Add to Cart"}
      </button>

      {/* Express checkout */}
      <Link
        href="/checkout"
        className="flex items-center justify-center gap-2 w-full py-3 border border-blue-600/30 hover:border-blue-500/60 text-blue-400 hover:text-blue-300 font-display font-600 text-sm rounded-xl transition-all duration-300 hover:bg-blue-600/5"
        onClick={handleAdd}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Proceed to Secure Checkout →
      </Link>

      {/* Payment methods */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {[["⚡", "Zelle"], ["💚", "CashApp"], ["🍎", "Apple Cash"], ["₿", "Crypto"]].map(([icon, label]) => (
          <div key={label} className="flex items-center gap-1">
            <span className="text-xs">{icon}</span>
            <span className="font-mono text-[9px] text-white/30 tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      {/* RUO */}
      <p className="text-center font-mono text-[10px] text-white/20 tracking-wide">
        RUO only · Not for human or veterinary use · 21+ required
      </p>
    </div>
  );
}
