"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeTax, apportionAmount } from "@/lib/taxMath";
import { computeVolumeDiscount, VOLUME_DISCOUNT_LABEL } from "@/lib/volumeDiscount";
import { computeBogoDiscount, BOGO_ENABLED, BOGO_LABEL, FREE_GIFT_LABEL } from "@/lib/bogoDiscount";
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

  // BOGO launch promo — same-product pairs get their 2nd unit free. When
  // active it's the ONLY discount in effect (see lib/bogoDiscount.ts), so it
  // suppresses the coupon, Volume Discount, and payment-method discount below.
  const bogoDiscount = computeBogoDiscount(items.map((i) => ({ quantity: i.quantity, unitPrice: i.price, productId: i.wcProductId })));
  const bogoActive = bogoDiscount > 0;

  const couponDiscount = bogoActive ? 0 : computeCouponDiscount(subtotal, coupon);
  // postCouponSubtotal = coupon only — this is the WC line-item/tax base.
  // Volume discount is a fee line (like the payment-method discount), NOT a
  // coupon, so it must not reduce this value (verified against a real order —
  // folding it in here double-counts the reduction and mismatches WC's total).
  const postCouponSubtotal = subtotal - couponDiscount;
  // Same pipeline slot as the coupon — mutually exclusive with it (see
  // lib/volumeDiscount.ts), so at most one of couponDiscount/volumeDiscount
  // is ever nonzero. discountedSubtotal is the "compounding" base used for
  // the free-shipping threshold and (server-side) the payment-discount calc.
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

  // Coupon apportioned per line and each product line taxed/rounded
  // independently, matching WooCommerce's actual behavior (and the
  // server-side computation in app/api/checkout/place-order) — rounding one
  // combined subtotal instead caused a real TOTAL_MISMATCH on multi-product
  // carts (order #1113). Keeping this preview in lockstep avoids showing the
  // customer a total that then differs from what place-order computes.
  const couponPerLine = apportionAmount(couponDiscount, items.map((i) => i.price * i.quantity));
  const productLineAmounts = items.map((i, idx) => i.price * i.quantity - couponPerLine[idx]);
  const tax = computeTax(taxRate, productLineAmounts, [volumeDiscount, paymentDiscountAmount, bogoDiscount], shippingCost, shippingTaxable);
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
        body: JSON.stringify({ code: trimmed, subtotal }),
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
        {items.map((item) => (
          <div key={`${item.slug}-${item.size}`} className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-white/70">{item.name}</p>
              <p className="font-mono text-xs text-blue-400/50 tracking-wider">{item.size} · qty {item.quantity}</p>
            </div>
            <span className="font-mono text-sm text-white/70 shrink-0">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {showFreeShippingProgress && (
        <div className="mb-4">
          <FreeShippingProgress data={freeShippingProgress} subtotal={subtotal} hasCoupon={!!coupon || bogoActive} />
        </div>
      )}

      {editableCoupon ? (
        <div className="border-t border-white/8 pt-4 mb-4">
          {bogoActive ? (
            <p className="font-mono text-[10px] text-white/30 leading-relaxed">
              Coupons aren&apos;t available during our Buy 1 Get 1 Free limited deal.
            </p>
          ) : coupon ? (
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
          <span className="font-body text-sm text-white/50">Subtotal</span>
          <span className="font-mono text-sm text-white/70">${subtotal.toFixed(2)}</span>
        </div>
        {coupon && !bogoActive && (
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
        {bogoDiscount > 0 && (
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
