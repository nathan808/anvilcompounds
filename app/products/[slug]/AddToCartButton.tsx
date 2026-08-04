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
        <div className="p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
            <span className="font-mono text-xs text-yellow-700 tracking-[0.2em] uppercase">
              Testing in Progress
            </span>
          </div>
          <p className="font-body text-sm text-mock-sub leading-relaxed mb-4">
            COA pending from our independent testing lab. This compound will be
            available for purchase once all verification steps are complete.
          </p>
          <Link
            href="/coas"
            className="inline-flex items-center gap-2 font-mono text-xs text-mock-cobaltInk hover:text-mock-cobalt transition-colors animated-underline"
          >
            View available COAs →
          </Link>
        </div>
        <p className="text-center font-mono text-[10px] text-mock-sub tracking-wide">
          RUO only · Not for human or veterinary use · 21+ required
        </p>
      </div>
    );
  }

  // ── Normal buy UI ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Price display + size selector, side by side so mg options sit to
          the right of the price instead of stacking below it. */}
      <div className="pt-1 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-display font-800 text-3xl text-mock-navy">
              ${unitPrice.toFixed(2)}
            </span>
            <span className="font-body text-sm text-mock-sub">/ vial</span>
            {discount > 0 && (
              <>
                <span className="font-body text-sm text-mock-sub line-through">
                  ${basePrice.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-green-700 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5">
                  {Math.round(discount * 100)}% off
                </span>
              </>
            )}
          </div>
          {qty > 1 && (
            <p className="font-mono text-xs text-mock-sub mt-1">
              {qty} × ${unitPrice.toFixed(2)} = <span className="text-mock-navy">${lineTotal.toFixed(2)} total</span>
            </p>
          )}
        </div>

        {sizes.length > 1 && (
          <div className="text-right">
            <p className="font-mono text-xs text-mock-sub tracking-widest uppercase mb-2">Select Size</p>
            <div className="flex flex-wrap gap-2 justify-end">
              {sizes.map((size, idx) => (
                <button
                  key={size}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-4 py-2 rounded-lg border font-mono text-sm font-500 transition-all duration-200 ${
                    selectedIndex === idx
                      ? "bg-mock-cobalt border-mock-cobaltInk text-white shadow-lg shadow-mock-cobalt/20"
                      : "bg-mock-surface2 border-mock-line text-mock-sub hover:border-mock-cobalt/30 hover:text-mock-navy"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quantity selector */}
      <div>
        <p className="font-mono text-xs text-mock-sub tracking-widest uppercase mb-3">Quantity</p>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => handleQtyChange(qty - 1)}
            className="w-9 h-9 rounded-lg bg-mock-surface2 border border-mock-line text-mock-sub hover:text-mock-navy hover:border-mock-cobalt/30 transition-all flex items-center justify-center font-display font-700 text-lg"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={MAX_QTY_PER_ITEM}
            value={qty}
            onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
            className="w-16 text-center bg-white border border-mock-line rounded-lg font-mono text-sm text-mock-navy py-2 outline-none focus:border-mock-cobalt/50"
          />
          <button
            onClick={() => handleQtyChange(qty + 1)}
            className="w-9 h-9 rounded-lg bg-mock-surface2 border border-mock-line text-mock-sub hover:text-mock-navy hover:border-mock-cobalt/30 transition-all flex items-center justify-center font-display font-700 text-lg"
          >
            +
          </button>
          {/* Quick pick buttons */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-mono text-[9px] text-mock-sub tracking-widest uppercase mr-1">Quick</span>
            {QUICK_PICKS.map((q) => (
              <button
                key={q}
                onClick={() => handleQtyChange(q)}
                className={`w-8 h-8 rounded-lg border font-mono text-xs transition-all duration-200 ${
                  qty === q
                    ? "bg-mock-cobalt border-mock-cobaltInk text-white"
                    : "bg-mock-surface2 border-mock-line text-mock-sub hover:text-mock-navy hover:border-mock-cobalt/30"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Volume pricing table */}
      <div className="rounded-xl border border-mock-line overflow-hidden">
        <div className="px-4 py-2.5 bg-mock-graphite border-b border-mock-line">
          <span className="font-mono text-[11px] font-700 text-gray-300 tracking-[0.2em] uppercase">Volume Pricing</span>
        </div>
        <div className="divide-y divide-mock-line">
          {VOLUME_TIERS.map((tier, i) => {
            const isActive = i === activeTierIdx;
            const tierPrice = getDiscountedPrice(basePrice, tier.min);
            return (
              <div
                key={tier.label}
                className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                  isActive ? "bg-mock-cobalt/10" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-mock-cobalt shrink-0" />}
                  {!isActive && <div className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />}
                  <span className={`font-body text-sm ${isActive ? "text-mock-navy" : "text-mock-sub"}`}>
                    {tier.displayRange}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm ${isActive ? "text-mock-navy" : "text-mock-sub"}`}>
                    ${tierPrice.toFixed(2)} ea
                  </span>
                  {tier.discount > 0 ? (
                    <span className={`font-mono text-xs ${isActive ? "text-mock-cobaltInk font-600" : "text-mock-sub"}`}>
                      {Math.round(tier.discount * 100)}% off
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-mock-sub">Full Price</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* CTA nudge */}
        {qty < MAX_QTY_PER_ITEM && (
          <div className="px-4 py-2.5 bg-mock-cobalt/5 border-t border-mock-cobalt/15">
            <p className="font-mono text-xs text-mock-cobaltInk">{ctaText}</p>
          </div>
        )}
      </div>

      {/* Urgency */}
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-mock-cobalt/8 border border-mock-cobalt/15">
        <svg className="w-3.5 h-3.5 text-mock-cobaltInk shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-mono text-[10px] text-mock-sub tracking-wide">
          Order before <strong className="text-mock-navy">12PM PST</strong> for same-day dispatch
        </p>
      </div>

      {/* Main CTA */}
      <button
        onClick={handleAdd}
        className={`block w-full text-center py-4 font-display font-700 text-base rounded-xl transition-all duration-300 ${
          added
            ? "bg-green-600 text-white"
            : "bg-mock-cobalt hover:bg-mock-cobaltInk text-white hover:shadow-xl hover:shadow-mock-cobalt/30 hover:-translate-y-0.5"
        }`}
      >
        {added
          ? "✓ Added to Order"
          : qty > 1
          ? `Add ${qty} Vials to Cart · $${lineTotal.toFixed(2)}`
          : "Add to Cart"}
      </button>

      {/* Express checkout */}
      <Link
        href="/checkout"
        className="flex items-center justify-center gap-2 w-full py-3 border border-mock-cobalt/30 hover:border-mock-cobaltInk/60 text-mock-cobaltInk hover:text-mock-cobalt font-display font-600 text-sm rounded-xl transition-all duration-300 hover:bg-mock-cobalt/5"
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
