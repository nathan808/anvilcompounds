"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import PurchaseFooter from "@/components/PurchaseFooter";
import {
  VOLUME_TIERS,
  MAX_QTY_PER_ITEM,
  getVolumeDiscount,
  getDiscountedPrice,
  getVolumeCTAText,
  getActiveTierIndex,
} from "@/lib/volumePricing";

interface Props {
  slug: string;
  name: string;
  sizes: string[];
  sizesPrices: number[];
  priceNumber: number;
  wcProductId: number;
  hasCoa: boolean;
  showFooter?: boolean;
}

const QUICK_PICKS = [1, 2, 5, 6, 9];

export default function AddToCartButton({
  slug,
  name,
  sizes,
  sizesPrices,
  priceNumber,
  wcProductId,
  hasCoa,
  showFooter = true,
}: Props) {
  const { addItem, openCart } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const basePrice = sizesPrices[selectedIndex] ?? priceNumber;
  const selectedSize = sizes[selectedIndex] ?? "";
  const discount = getVolumeDiscount(qty);
  const unitPrice = getDiscountedPrice(basePrice, qty);
  const lineTotal = unitPrice * qty;
  const activeTierIdx = getActiveTierIndex(qty);
  const ctaText = getVolumeCTAText(qty);

  const handleQtyChange = (next: number) => {
    setQty(Math.min(MAX_QTY_PER_ITEM, Math.max(1, next)));
  };

  const handleAdd = () => {
    addItem(
      { slug, name, size: selectedSize, price: unitPrice, basePrice, wcProductId },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  // ── Testing-in-progress gate ────────────────────────────────────────────────
  if (!hasCoa) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
            <span className="font-mono text-xs text-yellow-400 tracking-[0.2em] uppercase">
              Testing in Progress
            </span>
          </div>
          <p className="font-body text-sm text-white/50 leading-relaxed mb-4">
            COA pending from our independent testing lab. This compound will be
            available for purchase once all verification steps are complete.
          </p>
          <Link
            href="/coas"
            className="inline-flex items-center gap-2 font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors animated-underline"
          >
            View available COAs →
          </Link>
        </div>
        <p className="text-center font-mono text-[10px] text-white/20 tracking-wide">
          RUO only · Not for human or veterinary use · 21+ required
        </p>
      </div>
    );
  }

  // ── Normal buy UI ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Price display */}
      <div className="pt-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-display font-800 text-3xl text-white">
            ${unitPrice.toFixed(2)}
          </span>
          <span className="font-body text-sm text-white/30">/ vial</span>
          {discount > 0 && (
            <>
              <span className="font-body text-sm text-white/25 line-through">
                ${basePrice.toFixed(2)}
              </span>
              <span className="font-mono text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                {Math.round(discount * 100)}% off
              </span>
            </>
          )}
        </div>
        {qty > 1 && (
          <p className="font-mono text-xs text-white/30 mt-1">
            {qty} × ${unitPrice.toFixed(2)} = <span className="text-white/60">${lineTotal.toFixed(2)} total</span>
          </p>
        )}
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

      {/* Quantity selector */}
      <div>
        <p className="font-mono text-xs text-white/40 tracking-widest uppercase mb-3">Quantity</p>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => handleQtyChange(qty - 1)}
            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all flex items-center justify-center font-display font-700 text-lg"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={MAX_QTY_PER_ITEM}
            value={qty}
            onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
            className="w-16 text-center bg-white/5 border border-white/10 rounded-lg font-mono text-sm text-white py-2 outline-none focus:border-blue-500/50"
          />
          <button
            onClick={() => handleQtyChange(qty + 1)}
            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all flex items-center justify-center font-display font-700 text-lg"
          >
            +
          </button>
          {/* Quick pick buttons */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-mono text-[9px] text-white/25 tracking-widest uppercase mr-1">Quick</span>
            {QUICK_PICKS.map((q) => (
              <button
                key={q}
                onClick={() => handleQtyChange(q)}
                className={`w-8 h-8 rounded-lg border font-mono text-xs transition-all duration-200 ${
                  qty === q
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Volume pricing table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="px-4 py-2.5 bg-navy-800 border-b border-white/8">
          <span className="font-mono text-[10px] text-white/40 tracking-[0.2em] uppercase">Volume Pricing</span>
        </div>
        <div className="divide-y divide-white/5">
          {VOLUME_TIERS.map((tier, i) => {
            const isActive = i === activeTierIdx;
            const tierPrice = getDiscountedPrice(basePrice, tier.min);
            return (
              <div
                key={tier.label}
                className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                  isActive ? "bg-blue-600/10" : "bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                  {!isActive && <div className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />}
                  <span className={`font-body text-sm ${isActive ? "text-white" : "text-white/45"}`}>
                    {tier.displayRange}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm ${isActive ? "text-white" : "text-white/40"}`}>
                    ${tierPrice.toFixed(2)} ea
                  </span>
                  {tier.discount > 0 ? (
                    <span className={`font-mono text-xs ${isActive ? "text-blue-300 font-600" : "text-white/30"}`}>
                      {Math.round(tier.discount * 100)}% off
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-white/20">Full Price</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* CTA nudge */}
        {qty < MAX_QTY_PER_ITEM && (
          <div className="px-4 py-2.5 bg-blue-600/5 border-t border-blue-600/15">
            <p className="font-mono text-xs text-blue-400/80">{ctaText}</p>
          </div>
        )}
      </div>

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
        {added
          ? "✓ Added to Order"
          : qty > 1
          ? `Add ${qty} Vials to Cart — $${lineTotal.toFixed(2)}`
          : "Add to Cart"}
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

      {showFooter && (
        <div className="pt-1">
          <PurchaseFooter />
        </div>
      )}
    </div>
  );
}
