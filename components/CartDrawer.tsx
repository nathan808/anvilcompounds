"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { useFreeShippingProgress } from "@/lib/useFreeShippingProgress";
import FreeShippingProgress from "@/components/FreeShippingProgress";
import PaymentMethodsBar from "@/components/PaymentMethodsBar";
import { computeBogoDiscount, computeBogoLineDiscount, isBogoLineEligible, BOGO_ENABLED, BOGO_LABEL, BOGO_EXCLUDED_PRODUCT_IDS, FREE_GIFT_LABEL } from "@/lib/bogoDiscount";

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQty, itemCount, subtotal } = useCart();
  const { coupon, setCoupon } = useCheckout();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  // Collapsed by default so the price breakdown doesn't eat into the
  // (fixed-height, non-scrolling) footer's share of the drawer, leaving
  // more room for the scrollable product list above it.
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const freeShippingProgress = useFreeShippingProgress(subtotal, false, isCartOpen && items.length > 0);
  const bogoDiscount = computeBogoDiscount(items.map((i) => ({ quantity: i.quantity, unitPrice: i.price, regularPrice: i.regularPrice, productId: i.wcProductId })));
  // Full reconciling chain, replacing the earlier non-reconciling "value of
  // the free vial" framing: baseSubtotal (every unit at Base price) minus
  // singleVialDiscount (the everyday Base->Single gap, present even
  // without B1G1) minus bogoDiscount (the extra B1G1 pair savings) equals
  // exactly `subtotal - bogoDiscount`, the real post-BOGO total —
  // singleVialDiscount is defined as baseSubtotal - subtotal so this holds
  // by construction, at any quantity or item mix.
  const baseSubtotal = items.reduce((sum, i) => sum + (i.regularPrice ?? i.price) * i.quantity, 0);
  const singleVialDiscount = baseSubtotal - subtotal;
  // chk10: allowed to stack with BOGO, gated by its own $250 minimum —
  // checked and computed against the post-BOGO total ("10% off this
  // order", where "this order" already reflects BOGO), same as checkout.
  const postBogoSubtotal = subtotal - bogoDiscount;
  const couponDiscount = computeCouponDiscount(postBogoSubtotal, coupon);
  const total = postBogoSubtotal - couponDiscount;
  const hasAnyDiscount = singleVialDiscount > 0.001 || bogoDiscount > 0.001 || couponDiscount > 0.001;

  const applyCoupon = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal: postBogoSubtotal }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError("Could not validate coupon right now. Please try again.");
        setCoupon(null);
        return;
      }
      if (!data.valid) {
        setError(data.reason ?? "Invalid coupon code");
        setCoupon(null);
        return;
      }
      setCoupon({ code: data.code, discountType: data.discountType, amount: data.amount });
    } catch {
      setError("Could not validate coupon right now. Please try again.");
      setCoupon(null);
    } finally {
      setChecking(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCode("");
    setError("");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[90] w-full max-w-md bg-navy-900 border-l border-blue-600/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <h2 className="font-display font-700 text-white text-lg">Your Order</h2>
                <p className="font-mono text-xs text-white/30 tracking-wider mt-0.5">
                  {itemCount} {itemCount === 1 ? "item" : "items"} · For research use only
                </p>
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display font-600 text-white/40 mb-1">Your order is empty</p>
                    <p className="font-body text-sm text-white/25">Browse the catalog to add compounds</p>
                  </div>
                  <Link
                    href="/catalog"
                    onClick={closeCart}
                    className="mt-2 px-5 py-2.5 bg-blue-600/20 border border-blue-600/30 text-blue-300 font-display font-600 text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.slug}-${item.size}`} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-700 text-white text-sm">{item.name}</p>
                        <p className="font-mono text-xs text-blue-400/60 tracking-wider mt-0.5">{item.size}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.slug, item.size)}
                        className="text-white/20 hover:text-red-400 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.slug, item.size, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all flex items-center justify-center font-display font-600"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm text-white w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.slug, item.size, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all flex items-center justify-center font-display font-600"
                        >
                          +
                        </button>
                      </div>
                      {(() => {
                        const rawTotal = item.price * item.quantity;
                        const itemDiscount = computeBogoLineDiscount({ quantity: item.quantity, unitPrice: item.price, regularPrice: item.regularPrice, productId: item.wcProductId });
                        const discountedTotal = rawTotal - itemDiscount;
                        // Always cross out qty x Base price (not qty x the
                        // already-discounted single price) — matches the
                        // same "always reference Base" fix on the product
                        // page, and applies at any quantity: qty=1 shows
                        // Base vs. the single price, qty=2 shows Base x2 vs.
                        // the B1G1 total, qty=3+ shows Base x qty vs. the
                        // real (1 pair + extras) total.
                        const baseTotal = (item.regularPrice ?? item.price) * item.quantity;
                        const baseUnitPrice = item.regularPrice ?? item.price;
                        const discountedUnitPrice = discountedTotal / item.quantity;
                        const hasDiscount = baseTotal > discountedTotal + 0.001;
                        return (
                          <div className="text-right">
                            <div className="font-display font-700 text-white">
                              {hasDiscount && (
                                <span className="text-white/30 line-through font-500 mr-1.5">${baseTotal.toFixed(2)}</span>
                              )}
                              ${discountedTotal.toFixed(2)}
                            </div>
                            {/* Per-vial price — the same Base-vs-discounted
                                framing as the total above, but per unit, so
                                the savings read clearly even at a glance. */}
                            <div className="font-mono text-[10px] text-white/40 mt-0.5">
                              {hasDiscount && (
                                <span className="line-through mr-1">${baseUnitPrice.toFixed(2)}</span>
                              )}
                              ${discountedUnitPrice.toFixed(2)}/vial
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {BOGO_ENABLED && !BOGO_EXCLUDED_PRODUCT_IDS.has(item.wcProductId) && (
                      isBogoLineEligible({ quantity: item.quantity, unitPrice: item.price, productId: item.wcProductId }) ? (
                        <p className="font-mono text-[10px] text-blue-400 tracking-wide mt-2">
                          🎁 {BOGO_LABEL} applied — 1 vial free (-${(item.regularPrice ?? item.price).toFixed(2)} value)
                        </p>
                      ) : item.quantity % 2 === 1 ? (
                        <button
                          onClick={() => updateQty(item.slug, item.size, item.quantity + 1)}
                          className="font-mono text-[10px] text-blue-400/80 hover:text-blue-400 tracking-wide mt-2 underline underline-offset-2"
                        >
                          Add 1 more — get it free
                        </button>
                      ) : null
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-white/8 space-y-4">
                <FreeShippingProgress data={freeShippingProgress} subtotal={subtotal} hasCoupon={bogoDiscount > 0} />

                {/* Coupon — always visible (it's an action, not a numeric
                    detail), collapsible breakdown below is just the numbers. */}
                {coupon ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
                    <div>
                      <p className="font-mono text-xs text-blue-400 tracking-wide uppercase">{coupon.code}</p>
                      <p className="font-mono text-[10px] text-white/30">
                        {coupon.discountType === "percent" ? `${coupon.amount}% off` : `$${coupon.amount.toFixed(2)} off`}
                      </p>
                    </div>
                    <button type="button" onClick={removeCoupon} className="font-mono text-[10px] text-white/30 hover:text-white/60 underline underline-offset-2">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        value={code}
                        onChange={(e) => { setCode(e.target.value); setError(""); }}
                        placeholder="Coupon code"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-lg text-white placeholder-white/20 font-mono text-xs outline-none transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={checking || !code.trim()}
                        className="px-3 py-2 bg-white/8 hover:bg-white/12 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-mono text-xs text-white/70 uppercase tracking-wide transition-all shrink-0"
                      >
                        {checking ? "..." : "Apply"}
                      </button>
                    </div>
                    {error && <p className="font-body text-xs text-red-400 mt-1.5">{error}</p>}
                  </div>
                )}

                {hasAnyDiscount && (
                  <button
                    type="button"
                    onClick={() => setBreakdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 font-mono text-[10px] text-white/40 hover:text-white/70 tracking-widest uppercase transition-colors"
                  >
                    <span className={`transition-transform duration-200 ${breakdownOpen ? "rotate-90" : ""}`}>▸</span>
                    {breakdownOpen ? "Hide" : "Show"} price breakdown
                  </button>
                )}
                {hasAnyDiscount && breakdownOpen && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-white/50">Subtotal (Base Price)</span>
                      <span className="font-mono text-sm text-white/70">${baseSubtotal.toFixed(2)}</span>
                    </div>
                    {singleVialDiscount > 0.001 && (
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm text-blue-400">Discounted Pricing</span>
                        <span className="font-mono text-sm text-blue-400">-${singleVialDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {bogoDiscount > 0.001 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-body text-sm text-blue-400">{BOGO_LABEL}</span>
                          <span className="font-mono text-sm text-blue-400">-${bogoDiscount.toFixed(2)}</span>
                        </div>
                        <p className="font-mono text-[10px] text-white/25 mt-0.5">
                          One free vial per compound.
                        </p>
                      </div>
                    )}
                    {couponDiscount > 0.001 && (
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm text-blue-400">Coupon ({coupon?.code})</span>
                        <span className="font-mono text-sm text-blue-400">-${couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                {BOGO_ENABLED && (
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-blue-400">{FREE_GIFT_LABEL}</span>
                    <span className="font-mono text-sm text-blue-400">$0.00</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-body text-white/50">{hasAnyDiscount ? "Total" : "Subtotal"}</span>
                  <span className="font-display font-700 text-white text-xl">${total.toFixed(2)}</span>
                </div>
                <PaymentMethodsBar />
                <p className="font-mono text-[10px] text-white/20 tracking-wide leading-relaxed text-center">
                  Instructions sent after checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
                >
                  Proceed to Checkout →
                </Link>
                <button
                  onClick={closeCart}
                  className="block w-full text-center py-2 text-white/30 hover:text-white/60 font-body text-sm transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
