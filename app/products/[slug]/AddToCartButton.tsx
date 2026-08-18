"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import PurchaseFooter from "@/components/PurchaseFooter";
import PaymentMethodsBar from "@/components/PaymentMethodsBar";
import { simplifySizeLabel } from "@/lib/reconstitution";
import {
  VOLUME_TIERS,
  MAX_QTY_PER_ITEM,
  getVolumeDiscount,
  getDiscountedPrice,
  getVolumeCTAText,
  getActiveTierIndex,
} from "@/lib/volumePricing";
import { BOGO_ENABLED, BOGO_LABEL, BOGO_EXCLUDED_PRODUCT_IDS, getBogoLineIndex } from "@/lib/bogoDiscount";

interface Props {
  slug: string;
  name: string;
  sizes: string[];
  sizesPrices: number[];
  sizesOriginalPrices?: (number | null)[];
  sizesStock?: (number | null)[];
  priceNumber: number;
  wcProductId: number;
  hasCoa: boolean;
  showFooter?: boolean;
  // Size selection is controlled from ProductHero when provided, so the
  // product photo and COA button (rendered as siblings, not children, of
  // this component) can switch in step with the chosen size. Falls back to
  // owning its own state so this component still works standalone.
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  // Set true on both ProductHero instances. On mobile it's the only ATC
  // access once you scroll past the hero. On desktop the right column is
  // also `lg:sticky`, but that column's own content (price, size picker,
  // qty, volume table, CTA, express checkout, payment icons) is often
  // taller than the viewport — sticky pins the column's position but can't
  // shrink its content, so the actual Add to Cart button can sit below the
  // fold indefinitely even while the column is "stuck". This bar guarantees
  // the button stays reachable regardless of viewport height.
  stickyBarEnabled?: boolean;
}

const QUICK_PICKS = [1, 2, 5, 6, 9];

export default function AddToCartButton({
  slug,
  name,
  sizes,
  sizesPrices,
  sizesOriginalPrices,
  sizesStock,
  priceNumber,
  wcProductId,
  hasCoa,
  showFooter = true,
  selectedIndex: controlledIndex,
  onSelectIndex,
  stickyBarEnabled = false,
}: Props) {
  const { addItem, openCart, items: cartItems } = useCart();
  const [internalIndex, setInternalIndex] = useState(0);
  const selectedIndex = controlledIndex ?? internalIndex;
  const setSelectedIndex = onSelectIndex ?? setInternalIndex;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const mainCtaRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Sticky bar appears whenever the main "Add to Cart" button isn't
  // actually visible in the viewport — either scrolled past above it
  // (bottom < 0, the mobile case) or not yet reached below it (top >
  // viewport height, the desktop case where the sticky column's own
  // content is taller than the viewport — see stickyBarEnabled comment).
  // Disappears again once the page's compliance-footer section (id=
  // "compliance-footer" in ProductPageTemplate) starts entering the
  // viewport, so it never sits on top of the RUO text at the page bottom.
  useEffect(() => {
    if (!stickyBarEnabled) return;
    const handleScroll = () => {
      if (!mainCtaRef.current) return;
      const rect = mainCtaRef.current.getBoundingClientRect();
      const ctaOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;
      const complianceFooter = document.getElementById("compliance-footer");
      const complianceVisible = complianceFooter
        ? complianceFooter.getBoundingClientRect().top < window.innerHeight
        : false;
      setShowStickyBar(ctaOutOfView && !complianceVisible);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [stickyBarEnabled]);

  const basePrice = sizesPrices[selectedIndex] ?? priceNumber;
  const originalBasePrice = sizesOriginalPrices?.[selectedIndex] ?? null;
  const selectedSize = sizes[selectedIndex] ?? "";
  const discount = getVolumeDiscount(qty);
  const unitPrice = getDiscountedPrice(basePrice, qty);
  const lineTotal = unitPrice * qty;
  const activeTierIdx = getActiveTierIndex(qty);
  const ctaText = getVolumeCTAText(qty);

  // BOGO preview — mirrors the exact one-free-unit-per-checkout cap used at
  // checkout (lib/bogoDiscount.ts) by simulating this selection appended to
  // whatever's already in the cart. Keeps this page's shown total honest:
  // it only shows a discount when the cart would actually give one, e.g.
  // not when another line already claimed the order's one free unit.
  const isBogoExcluded = BOGO_EXCLUDED_PRODUCT_IDS.has(wcProductId);
  const bogoPreviewItems = [
    ...cartItems.map((i) => ({ quantity: i.quantity, unitPrice: i.price, productId: i.wcProductId })),
    { quantity: qty, unitPrice, productId: wcProductId },
  ];
  const bogoLineIndex = BOGO_ENABLED ? getBogoLineIndex(bogoPreviewItems) : -1;
  const thisLineGetsBogo = bogoLineIndex === bogoPreviewItems.length - 1;
  const bogoUsedElsewhere = BOGO_ENABLED && !isBogoExcluded && qty >= 2 && !thisLineGetsBogo;
  const bogoDiscountForLine = thisLineGetsBogo ? unitPrice : 0;
  const discountedLineTotal = lineTotal - bogoDiscountForLine;

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
      {BOGO_ENABLED && !isBogoExcluded && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mock-cobalt/10 border border-mock-cobalt/20 flex-wrap">
          <span className="font-display font-700 text-xs text-mock-cobaltInk tracking-wide">
            🎁 {BOGO_LABEL}
          </span>
          <span className="font-body text-xs text-mock-sub">
            {bogoUsedElsewhere
              ? "— already applied to another item in your cart. One BOGO discount per order."
              : "— add 2 to unlock, applied automatically. Limited to one per order. + Free Bacteriostatic Water with every order."}
          </span>
        </div>
      )}
      {/* Price display + size selector, side by side so mg options sit to
          the right of the price instead of stacking below it. */}
      <div className="pt-1 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-display font-800 text-3xl text-mock-navy">
              ${unitPrice.toFixed(2)}
            </span>
            <span className="font-body text-sm text-mock-sub">/ vial</span>
            {discount > 0 ? (
              <>
                <span className="font-body text-sm text-mock-sub line-through">
                  ${basePrice.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-green-700 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5">
                  {Math.round(discount * 100)}% off
                </span>
              </>
            ) : originalBasePrice ? (
              <>
                <span className="font-body text-sm text-mock-sub line-through">
                  ${originalBasePrice.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-green-700 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5">
                  Launch Price
                </span>
              </>
            ) : null}
          </div>
          {(() => {
            const stockForSize = sizesStock?.[selectedIndex];
            if (stockForSize === undefined || stockForSize === null || stockForSize >= 5) return null;
            return (
              <p className="mt-1 font-mono text-xs text-amber-600 font-600">
                {stockForSize <= 0 ? "Out of stock" : "Limited qty."}
              </p>
            );
          })()}
          {qty > 1 && (
            <div className="mt-1 space-y-0.5">
              <p className="font-mono text-xs text-mock-sub">
                {qty} × ${unitPrice.toFixed(2)} ={" "}
                {thisLineGetsBogo ? (
                  <>
                    <span className="line-through text-mock-sub/50">${lineTotal.toFixed(2)}</span>{" "}
                    <span className="text-mock-navy font-600">${discountedLineTotal.toFixed(2)} total</span>
                  </>
                ) : (
                  <span className="text-mock-navy">${lineTotal.toFixed(2)} total</span>
                )}
              </p>
              {thisLineGetsBogo && (
                <p className="font-mono text-[11px] text-green-700">
                  🎁 1 vial free — Buy 1 Get 1 Free applied (one per order)
                </p>
              )}
              {bogoUsedElsewhere && (
                <p className="font-mono text-[11px] text-mock-sub">
                  Buy 1 Get 1 Free already used on another item in your cart — one discount per order.
                </p>
              )}
            </div>
          )}
        </div>

        {sizes.length > 1 ? (
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
                  {simplifySizeLabel(size)}
                </button>
              ))}
            </div>
          </div>
        ) : sizes.length === 1 ? (
          <div className="text-right">
            <p className="font-mono text-xs text-mock-sub tracking-widest uppercase mb-2">Select Size</p>
            {/* Styled to match the "selected" state of the multi-size
                buttons above (blue fill) even though there's only one
                option here and nothing to toggle — keeps the selected-size
                treatment consistent across every product. */}
            <span className="inline-block px-4 py-2 rounded-lg border border-mock-cobaltInk bg-mock-cobalt font-mono text-sm text-white shadow-lg shadow-mock-cobalt/20 whitespace-nowrap">
              {simplifySizeLabel(sizes[0])}
            </span>
          </div>
        ) : null}
      </div>

      {/* Quantity selector */}
      <div>
        <p className="font-mono text-xs text-mock-sub tracking-widest uppercase mb-3">Select Quantity</p>
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
            // The 2-vial tier is the BOGO launch promo, not a blended
            // per-unit discount — show the 2nd-vial-free framing and the
            // resulting average price, not the (unchanged, full) tier price.
            const isBogoTier = tier.min === 2 && tier.max === 2;
            const tierPrice = isBogoTier ? basePrice / 2 : getDiscountedPrice(basePrice, tier.min);
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
                  {isBogoTier ? (
                    <span className={`font-mono text-xs ${isActive ? "text-green-700 font-600" : "text-green-700/70"}`}>
                      🎁 100% off 2nd
                    </span>
                  ) : tier.discount > 0 ? (
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
        ref={mainCtaRef}
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
          ? `Add ${qty} Vials to Cart · $${discountedLineTotal.toFixed(2)}`
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

      <PaymentMethodsBar />

      {showFooter && (
        <div className="pt-1">
          <PurchaseFooter />
        </div>
      )}

      {/* Sticky bottom bar — mobile and desktop both, see stickyBarEnabled prop comment. */}
      {stickyBarEnabled && (
        <div
          // z-[55]: above BackToTop's z-50 (components/BackToTop.tsx) — that
          // button also sits bottom-right and is mounted later in the DOM
          // (root layout), so without a higher z-index here it would render
          // on top of this bar's Add to Cart button instead of being
          // cleanly covered by it.
          className={`fixed bottom-0 left-0 right-0 z-[55] bg-white border-t border-mock-line shadow-[0_-4px_16px_rgba(0,0,0,0.12)] px-4 py-3 transition-transform duration-300 ${
            showStickyBar ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-mock-sub tracking-wide uppercase truncate">
                {simplifySizeLabel(selectedSize)}
                {qty > 1 ? ` × ${qty}` : ""}
              </p>
              <p className="font-display font-800 text-lg text-mock-navy">
                ${(qty > 1 ? discountedLineTotal : unitPrice).toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleAdd}
              className={`shrink-0 px-6 py-3 rounded-xl font-display font-700 text-sm transition-all duration-300 ${
                added ? "bg-green-600 text-white" : "bg-mock-cobalt hover:bg-mock-cobaltInk text-white"
              }`}
            >
              {added ? "✓ Added" : "Add to Cart"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
