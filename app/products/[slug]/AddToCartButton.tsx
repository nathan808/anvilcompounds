"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import PurchaseFooter from "@/components/PurchaseFooter";
import PaymentMethodsBar from "@/components/PaymentMethodsBar";
import { simplifySizeLabel } from "@/lib/reconstitution";
import { MAX_QTY_PER_ITEM } from "@/lib/volumePricing";
import { BOGO_ENABLED, BOGO_LABEL, BOGO_EXCLUDED_PRODUCT_IDS, BUNDLE_PRODUCT_IDS } from "@/lib/bogoDiscount";

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
  // Quantity is controlled from ProductHero too, for the same reason: this
  // component is mounted TWICE at once (mobile + desktop layouts, CSS-
  // hidden rather than unmounted — see ProductHero.tsx), so uncontrolled
  // internal qty state left each instance with its own independent value.
  // Interacting with one (e.g. picking "3+" on the visible mobile layout)
  // never touched the other, so switching/resizing to the other breakpoint
  // showed a stale quantity — the reported "works on mobile, not desktop"
  // bug. Falls back to internal state so this component still works
  // standalone.
  qty?: number;
  onQtyChange?: (qty: number) => void;
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
  qty: controlledQty,
  onQtyChange,
  stickyBarEnabled = false,
}: Props) {
  const { addItem, openCart } = useCart();
  const [internalIndex, setInternalIndex] = useState(0);
  const selectedIndex = controlledIndex ?? internalIndex;
  const setSelectedIndex = onSelectIndex ?? setInternalIndex;
  // BOGO-eligible products default to 2 on first load — the 2nd vial free,
  // applied automatically — but that's only the starting point: the
  // customer can freely edit back down to 1 (or up past 2) afterward.
  // Excluded products (bundles, BAC water — see BOGO_EXCLUDED_PRODUCT_IDS)
  // default to the normal 1 vial.
  const isBogoExcluded = BOGO_EXCLUDED_PRODUCT_IDS.has(wcProductId);
  const bogoDefaultQty = BOGO_ENABLED && !isBogoExcluded ? 2 : 1;
  const [internalQty, setInternalQty] = useState(bogoDefaultQty);
  const qty = controlledQty ?? internalQty;
  const setQty = onQtyChange ?? setInternalQty;
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

  // unitPrice = WC's active/Single price (the "1 vial" price). No more
  // per-quantity volume-tier scaling — price is flat regardless of qty;
  // only the BOGO fee (below) changes what a 2-vial line actually totals.
  const unitPrice = sizesPrices[selectedIndex] ?? priceNumber;
  // originalBasePrice = WC's regular_price, the crossed-out "Base" price —
  // a B1G1 pair always totals exactly this (lib/bogoDiscount.ts).
  const originalBasePrice = sizesOriginalPrices?.[selectedIndex] ?? null;
  const selectedSize = sizes[selectedIndex] ?? "";
  const b1g1UnitPrice = (originalBasePrice ?? unitPrice) / 2;
  const lineTotal = unitPrice * qty;
  // Base price x qty — the reference point the breakdown line always shows
  // crossed out, per "always refer to original base price" (not the
  // already-discounted single price) — e.g. 2 x $99 Base crossed out, next
  // to the real $99 B1G1 total, or 5 x $99 crossed out next to the real
  // $321 total.
  const baseLineTotal = (originalBasePrice ?? unitPrice) * qty;

  // Every qualifying SKU gets its own B1G1 pair now (no more shared
  // one-per-order cap), so this line's eligibility no longer depends on
  // what else is in the cart — just its own quantity and exclusion status.
  const thisLineGetsBogo = BOGO_ENABLED && !isBogoExcluded && qty >= 2;
  const bogoDiscountForLine = thisLineGetsBogo ? 2 * unitPrice - (originalBasePrice ?? unitPrice) : 0;
  const discountedLineTotal = lineTotal - bogoDiscountForLine;
  // Headline "/vial" price — the true blended rate (what the customer
  // actually pays per vial at this quantity), not just the qty=2 B1G1 rate.
  // Only one pair ever gets discounted, so at qty=5 e.g. that's (1 pair at
  // Base + 3 more at the single price) / 5 vials, not Base/2 — showing
  // Base/2 there was wrong (order total $321 was showing as "$49.50/vial",
  // which doesn't reconcile: 5 x $49.50 = $247.50, not $321). Matches
  // b1g1UnitPrice exactly at qty=2 and unitPrice exactly at qty=1, so this
  // replaces displayUnitPrice everywhere without changing those two cases.
  const displayUnitPrice = qty > 0 ? discountedLineTotal / qty : unitPrice;

  const handleQtyChange = (next: number) => {
    setQty(Math.min(MAX_QTY_PER_ITEM, Math.max(1, next)));
  };

  // Belt-and-suspenders: the size chips already can't be clicked into a
  // sold-out size and the default selection skips one too, but guard the
  // actual add here as well in case selectedIndex ever lands on one anyway.
  const selectedSizeSoldOut = sizesStock?.[selectedIndex] === 0;

  const handleAdd = () => {
    if (selectedSizeSoldOut) return;
    addItem(
      { slug, name, size: selectedSize, price: unitPrice, regularPrice: originalBasePrice ?? unitPrice, wcProductId },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  // ── Out-of-stock gate — Research Bundles ────────────────────────────────────
  if (BUNDLE_PRODUCT_IDS.has(wcProductId)) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="font-mono text-xs text-red-700 tracking-[0.2em] uppercase">
              Out of Stock
            </span>
          </div>
          <p className="font-body text-sm text-mock-sub leading-relaxed">
            This bundle is currently unavailable. Check back later, or browse individual compounds in the catalog.
          </p>
        </div>
        <p className="text-center font-mono text-[10px] text-mock-sub tracking-wide">
          RUO only · Not for human or veterinary use · 21+ required
        </p>
      </div>
    );
  }

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
            — applied automatically, 2nd vial free. One B1G1 pair per compound. + Free Bacteriostatic Water with every order.
          </span>
        </div>
      )}
      {/* Price display + size selector, side by side so mg options sit to
          the right of the price instead of stacking below it. */}
      <div className="pt-1 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-display font-800 text-3xl text-mock-navy">
              ${displayUnitPrice.toFixed(2)}
            </span>
            <span className="font-body text-sm text-mock-sub">/ vial</span>
            {originalBasePrice ? (
              <>
                <span className="font-body text-sm text-mock-sub line-through">
                  ${originalBasePrice.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-green-700 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5">
                  {thisLineGetsBogo ? "B1G1" : "Discounted"}
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
                {qty} × ${(originalBasePrice ?? unitPrice).toFixed(2)} ={" "}
                {baseLineTotal > discountedLineTotal + 0.001 ? (
                  <>
                    <span className="line-through text-mock-sub/50">${baseLineTotal.toFixed(2)}</span>{" "}
                    <span className="text-mock-navy font-600">${discountedLineTotal.toFixed(2)} total</span>
                  </>
                ) : (
                  <span className="text-mock-navy">${discountedLineTotal.toFixed(2)} total</span>
                )}
              </p>
              {thisLineGetsBogo && (
                <p className="font-mono text-[11px] text-green-700">
                  🎁 1 vial free — Buy 1 Get 1 Free applied (one pair per compound)
                </p>
              )}
            </div>
          )}
        </div>

        {sizes.length > 1 ? (
          <div className="text-right">
            <p className="font-mono text-xs text-mock-sub tracking-widest uppercase mb-2">Select Size</p>
            <div className="flex flex-wrap gap-2 justify-end">
              {sizes.map((size, idx) => {
                const soldOut = sizesStock?.[idx] === 0;
                return (
                  <button
                    key={size}
                    disabled={soldOut}
                    onClick={() => !soldOut && setSelectedIndex(idx)}
                    className={`px-4 py-2 rounded-lg border font-mono text-sm font-500 transition-all duration-200 ${
                      soldOut
                        ? "bg-mock-surface2/50 border-mock-line text-mock-sub/40 cursor-not-allowed line-through"
                        : selectedIndex === idx
                        ? "bg-mock-cobalt border-mock-cobaltInk text-white shadow-lg shadow-mock-cobalt/20"
                        : "bg-mock-surface2 border-mock-line text-mock-sub hover:border-mock-cobalt/30 hover:text-mock-navy"
                    }`}
                  >
                    {simplifySizeLabel(size)}
                    {soldOut && <span className="ml-1.5 text-[10px] no-underline">Sold Out</span>}
                  </button>
                );
              })}
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
        {isBogoExcluded ? (
          // Flat pricing at any quantity (no more volume-discount tiers) —
          // a plain stepper is all this needs.
          <div className="flex items-center gap-3">
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
          </div>
        ) : (
          // Simple 2-option toggle: 1 vial at the single price, or 2 vials
          // at the B1G1 rate (Base price for the pair). No numeric stepper.
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setQty(1)}
              className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                qty === 1
                  ? "bg-mock-cobalt border-mock-cobaltInk text-white shadow-lg shadow-mock-cobalt/20"
                  : "bg-mock-surface2 border-mock-line text-mock-navy hover:border-mock-cobalt/30"
              }`}
            >
              <span className="block font-display font-700 text-sm">1 vial</span>
              <span className="block font-mono text-xs mt-0.5">
                {originalBasePrice && (
                  <span className={`line-through mr-1 ${qty === 1 ? "text-white/50" : "text-mock-sub/60"}`}>
                    ${originalBasePrice.toFixed(2)}
                  </span>
                )}
                <span className={qty === 1 ? "text-white/80" : "text-mock-sub"}>${unitPrice.toFixed(2)}</span>
              </span>
            </button>
            <button
              onClick={() => setQty(2)}
              className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                qty === 2
                  ? "bg-mock-cobalt border-mock-cobaltInk text-white shadow-lg shadow-mock-cobalt/20"
                  : "bg-mock-surface2 border-mock-line text-mock-navy hover:border-mock-cobalt/30"
              }`}
            >
              <span className="block font-display font-700 text-sm">🎁 2 vials — B1G1</span>
              <span className="block font-mono text-xs mt-0.5">
                {originalBasePrice && (
                  <span className={`line-through mr-1 ${qty === 2 ? "text-white/50" : "text-mock-sub/60"}`}>
                    ${originalBasePrice.toFixed(2)}
                  </span>
                )}
                <span className={qty === 2 ? "text-white/80" : "text-mock-sub"}>${b1g1UnitPrice.toFixed(2)}/vial</span>
              </span>
            </button>
          </div>
        )}
        {/* 3+ vials — kept out of the way for the common 1-or-2 case, but
            still reachable. One B1G1 pair for this compound plus each extra
            vial at the single price — the breakdown line just below the
            price header already shows the resulting total for any qty. */}
        {!isBogoExcluded && (
          qty > 2 ? (
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => handleQtyChange(qty - 1)}
                className="w-8 h-8 rounded-lg bg-mock-surface2 border border-mock-line text-mock-sub hover:text-mock-navy hover:border-mock-cobalt/30 transition-all flex items-center justify-center font-display font-700"
              >
                −
              </button>
              <span className="font-mono text-sm text-mock-navy w-6 text-center">{qty}</span>
              <button
                onClick={() => handleQtyChange(qty + 1)}
                className="w-8 h-8 rounded-lg bg-mock-surface2 border border-mock-line text-mock-sub hover:text-mock-navy hover:border-mock-cobalt/30 transition-all flex items-center justify-center font-display font-700"
              >
                +
              </button>
              <span className="font-mono text-xs text-mock-sub">vials</span>
            </div>
          ) : (
            <button
              onClick={() => setQty(3)}
              className="mt-3 font-mono text-xs text-mock-cobaltInk hover:text-mock-cobalt underline underline-offset-2"
            >
              Need 3 or more?
            </button>
          )
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
        disabled={selectedSizeSoldOut}
        className={`block w-full text-center py-4 font-display font-700 text-base rounded-xl transition-all duration-300 ${
          selectedSizeSoldOut
            ? "bg-mock-surface2 text-mock-sub/50 cursor-not-allowed"
            : added
            ? "bg-green-600 text-white"
            : "bg-mock-cobalt hover:bg-mock-cobaltInk text-white hover:shadow-xl hover:shadow-mock-cobalt/30 hover:-translate-y-0.5"
        }`}
      >
        {selectedSizeSoldOut
          ? "Sold Out"
          : added
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
