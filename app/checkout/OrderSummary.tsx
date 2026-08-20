"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeTax } from "@/lib/taxMath";
import { computeVolumeDiscount, VOLUME_DISCOUNT_LABEL } from "@/lib/volumeDiscount";
import { computeBogoDiscount, computeBogoLineDiscount, BOGO_ENABLED, BOGO_LABEL, FREE_GIFT_LABEL } from "@/lib/bogoDiscount";
import { useFreeShippingProgress } from "@/lib/useFreeShippingProgress";
import FreeShippingProgress from "@/components/FreeShippingProgress";

interface PaymentDiscount {
  label: string;
  amount: number;
}

interface OrderSummaryProps {
  editableCoupon?: boolean;
  showShipping?: boolean;
  paymentDiscount?: PaymentDiscount | null;
  onTotalChange?: (total: number) => void;
  // Step 2 already shows this via ShippingMethods.tsx, right next to the
  // Ground option — leave it off there (default) to avoid showing it twice.
  showFreeShippingProgress?: boolean;
}

export default function OrderSummary({ editableCoupon = true, showShipping = false, paymentDiscount = null, onTotalChange, showFreeShippingProgress = false }: OrderSummaryProps) {
  const { items, subtotal } = useCart();
  const { coupon, setCoupon, shipping, step1 } = useCheckout();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [shippingTaxable, setShippingTaxable] = useState(false);
  // Starts false whenever a tax lookup is needed, so the very first render's
  // (necessarily tax-free) total never gets reported to onTotalChange. Without
  // this, the payment page could capture a pre-tax preview total the instant
  // it mounts and submit it if the customer clicks before the tax-rate fetch
  // resolves — the server always includes tax, so that preview would never
  // match, surfacing as a false "Your cart has changed" error.
  const [taxResolved, setTaxResolved] = useState(!showShipping || !step1.state);

  // BOGO launch promo — same-product pairs get their 2nd unit free. Still
  // suppresses the $200+ Volume Discount and the payment-method discount
  // (see lib/bogoDiscount.ts) — a coupon (chk10) is now allowed to stack
  // with it, gated behind its own $250 minimum-order requirement.
  const bogoDiscount = computeBogoDiscount(items.map((i) => ({ quantity: i.quantity, unitPrice: i.price, regularPrice: i.regularPrice, productId: i.wcProductId })));
  const bogoActive = bogoDiscount > 0;
  // Full reconciling chain, replacing the earlier non-reconciling "value of
  // the free vial" framing: baseSubtotal (every unit at Base price) minus
  // singleVialDiscount (the everyday Base->Single gap, present even
  // without B1G1) minus bogoDiscount (the extra B1G1 pair savings) equals
  // exactly `subtotal`, the real cart subtotal used everywhere below —
  // singleVialDiscount is defined as baseSubtotal - subtotal so this holds
  // by construction, at any quantity or item mix.
  const baseSubtotal = items.reduce((sum, i) => sum + (i.regularPrice ?? i.price) * i.quantity, 0);
  const singleVialDiscount = baseSubtotal - subtotal;
  const hasAnyDiscount = singleVialDiscount > 0.001 || bogoDiscount > 0.001;

  // What the order actually totals after BOGO, before any coupon — the
  // base chk10's $250 minimum and its own 10% are computed against
  // ("10% off this order", where "this order" already reflects BOGO).
  const postBogoSubtotal = subtotal - bogoDiscount;
  const couponDiscount = computeCouponDiscount(postBogoSubtotal, coupon);
  const postCouponSubtotal = subtotal - couponDiscount;
  // Same pipeline slot as the coupon — mutually exclusive with it (see
  // lib/volumeDiscount.ts), and with BOGO. discountedSubtotal is the
  // "compounding" base used for the free-shipping threshold and
  // (server-side) the payment-discount calc.
  const volumeDiscount = bogoActive ? 0 : computeVolumeDiscount(subtotal, !!coupon);
  const discountedSubtotal = postCouponSubtotal - volumeDiscount - bogoDiscount;
  const paymentDiscountAmount = bogoActive ? 0 : (paymentDiscount?.amount ?? 0);
  const shippingCost = showShipping ? (shipping?.cost ?? 0) : 0;

  const freeShippingProgress = useFreeShippingProgress(discountedSubtotal, !!coupon, showFreeShippingProgress);

  useEffect(() => {
    if (!showShipping || !step1.state) { setTaxRate(0); setShippingTaxable(false); setTaxResolved(true); return; }
    let cancelled = false;
    setTaxResolved(false);
    fetch(`/api/checkout/tax-rate?state=${encodeURIComponent(step1.state)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setTaxRate(typeof data.rate === "number" ? data.rate : 0);
        setShippingTaxable(!!data.shippingTaxable);
      })
      .catch(() => { if (!cancelled) { setTaxRate(0); setShippingTaxable(false); } })
      .finally(() => { if (!cancelled) setTaxResolved(true); });
    return () => { cancelled = true; };
  }, [showShipping, step1.state]);

  // Each product line taxed/rounded independently (not one combined
  // subtotal — see computeTax's docstring re: the TOTAL_MISMATCH on order
  // #1113), matching the server-side computation in place-order exactly.
  // Coupon is its own fee-tax entry (like BOGO/Volume Discount), not
  // apportioned across product lines — see the coupon note in place-order.
  const productLineAmounts = items.map((i) => i.price * i.quantity);
  const tax = computeTax(taxRate, productLineAmounts, [volumeDiscount, paymentDiscountAmount, couponDiscount, bogoDiscount], shippingCost, shippingTaxable);
  const total = postCouponSubtotal - volumeDiscount - paymentDiscountAmount - bogoDiscount + shippingCost + (showShipping ? tax.totalTax : 0);

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

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  const totalLabel = showShipping || paymentDiscount ? "Total" : coupon ? "New Subtotal" : "Total";
  const displayedTotal = showShipping || paymentDiscount ? total : discountedSubtotal;

  useEffect(() => {
    if (!taxResolved) return;
    onTotalChange?.(displayedTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedTotal, taxResolved]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display font-700 text-white mb-4">Order Summary</h3>

      <div className="space-y-3 mb-5">
        {items.map((item) => {
          const rawTotal = item.price * item.quantity;
          const itemDiscount = computeBogoLineDiscount({ quantity: item.quantity, unitPrice: item.price, regularPrice: item.regularPrice, productId: item.wcProductId });
          const discountedTotal = rawTotal - itemDiscount;
          // Always reference Base price (qty x Base, and Base per vial),
          // not the already-discounted single price — same framing as the
          // product page and cart drawer, applies at any quantity.
          const baseTotal = (item.regularPrice ?? item.price) * item.quantity;
          const baseUnitPrice = item.regularPrice ?? item.price;
          const discountedUnitPrice = discountedTotal / item.quantity;
          const hasDiscount = baseTotal > discountedTotal + 0.001;
          return (
            <div key={`${item.slug}-${item.size}`} className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-white/70">{item.name}</p>
                <p className="font-mono text-xs text-blue-400/50 tracking-wider">{item.size} · qty {item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-sm text-white/70">
                  {hasDiscount && (
                    <span className="text-white/30 line-through mr-1.5">${baseTotal.toFixed(2)}</span>
                  )}
                  ${discountedTotal.toFixed(2)}
                </div>
                <div className="font-mono text-[10px] text-white/35 mt-0.5">
                  {hasDiscount && (
                    <span className="line-through mr-1">${baseUnitPrice.toFixed(2)}</span>
                  )}
                  ${discountedUnitPrice.toFixed(2)}/vial
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showFreeShippingProgress && (
        <div className="mb-4">
          <FreeShippingProgress data={freeShippingProgress} subtotal={subtotal} hasCoupon={!!coupon || bogoActive} />
        </div>
      )}

      {editableCoupon ? (
        <div className="border-t border-white/8 pt-4 mb-4">
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
            <>
              <label className={labelClass}>Coupon Code</label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(""); }}
                  placeholder="Enter code"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={checking || !code.trim()}
                  className="px-4 py-3 bg-white/8 hover:bg-white/12 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-mono text-xs text-white/70 uppercase tracking-wide transition-all shrink-0"
                >
                  {checking ? "..." : "Apply"}
                </button>
              </div>
              {error && <p className="font-body text-xs text-red-400 mt-2">{error}</p>}
            </>
          )}
        </div>
      ) : coupon ? (
        <div className="border-t border-white/8 pt-4 mb-4">
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
            <div>
              <p className="font-mono text-xs text-blue-400 tracking-wide uppercase">{coupon.code}</p>
              <p className="font-mono text-[10px] text-white/30">
                {coupon.discountType === "percent" ? `${coupon.amount}% off` : `$${coupon.amount.toFixed(2)} off`}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Row order per CHECKOUT_SPEC.md: subtotal → coupon/volume discount → payment discount → shipping → total */}
      <div className="border-t border-white/8 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-white/50">{hasAnyDiscount ? "Subtotal (Base Price)" : "Subtotal"}</span>
          <span className="font-mono text-sm text-white/70">${(hasAnyDiscount ? baseSubtotal : subtotal).toFixed(2)}</span>
        </div>
        {singleVialDiscount > 0.001 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-blue-400">Discounted Pricing</span>
            <span className="font-mono text-sm text-blue-400">-${singleVialDiscount.toFixed(2)}</span>
          </div>
        )}
        {coupon && couponDiscount > 0.001 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-white/50">Coupon ({coupon.code})</span>
            <span className="font-mono text-sm text-blue-400">-${couponDiscount.toFixed(2)}</span>
          </div>
        )}
        {volumeDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-white/50">{VOLUME_DISCOUNT_LABEL}</span>
            <span className="font-mono text-sm text-blue-400">-${volumeDiscount.toFixed(2)}</span>
          </div>
        )}
        {bogoDiscount > 0.001 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-blue-400">{BOGO_LABEL}</span>
            <span className="font-mono text-sm text-blue-400">-${bogoDiscount.toFixed(2)}</span>
          </div>
        )}
        {BOGO_ENABLED && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-blue-400">{FREE_GIFT_LABEL}</span>
            <span className="font-mono text-sm text-blue-400">$0.00</span>
          </div>
        )}
        {paymentDiscount && paymentDiscountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-white/50">{paymentDiscount.label}</span>
            <span className="font-mono text-sm text-blue-400">-${paymentDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        {showShipping && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-white/50">Shipping{shipping ? ` (${shipping.title})` : ""}</span>
            <span className="font-mono text-sm text-white/70">
              {shipping ? (shipping.cost === 0 ? "Free" : `$${shipping.cost.toFixed(2)}`) : "—"}
            </span>
          </div>
        )}
        {showShipping && tax.totalTax > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-white/50">Tax</span>
            <span className="font-mono text-sm text-white/70">${tax.totalTax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <span className="font-body text-white/50">{totalLabel}</span>
          <span className="font-display font-800 text-white text-xl">${displayedTotal.toFixed(2)}</span>
        </div>
      </div>

      <p className="font-mono text-[10px] text-white/20 tracking-wide mt-3">
        {showShipping ? "US domestic only." : "Shipping calculated in the next step. US domestic only."}
      </p>
    </div>
  );
}
