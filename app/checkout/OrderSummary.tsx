"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeTax } from "@/lib/taxMath";

interface PaymentDiscount {
  label: string;
  amount: number;
}

interface OrderSummaryProps {
  editableCoupon?: boolean;
  showShipping?: boolean;
  paymentDiscount?: PaymentDiscount | null;
}

export default function OrderSummary({ editableCoupon = true, showShipping = false, paymentDiscount = null }: OrderSummaryProps) {
  const { items, subtotal } = useCart();
  const { coupon, setCoupon, shipping, step1 } = useCheckout();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [shippingTaxable, setShippingTaxable] = useState(false);

  const couponDiscount = computeCouponDiscount(subtotal, coupon);
  const postCouponSubtotal = subtotal - couponDiscount;
  const paymentDiscountAmount = paymentDiscount?.amount ?? 0;
  const shippingCost = showShipping ? (shipping?.cost ?? 0) : 0;

  useEffect(() => {
    if (!showShipping || !step1.state) { setTaxRate(0); setShippingTaxable(false); return; }
    let cancelled = false;
    fetch(`/api/checkout/tax-rate?state=${encodeURIComponent(step1.state)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setTaxRate(typeof data.rate === "number" ? data.rate : 0);
        setShippingTaxable(!!data.shippingTaxable);
      })
      .catch(() => { if (!cancelled) { setTaxRate(0); setShippingTaxable(false); } });
    return () => { cancelled = true; };
  }, [showShipping, step1.state]);

  const tax = computeTax(taxRate, postCouponSubtotal, paymentDiscountAmount, shippingCost, shippingTaxable);
  const total = postCouponSubtotal - paymentDiscountAmount + shippingCost + (showShipping ? tax.totalTax : 0);

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
  const displayedTotal = showShipping || paymentDiscount ? total : postCouponSubtotal;

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

      {/* Row order per CHECKOUT_SPEC.md: subtotal → coupon → payment discount → shipping → total */}
      <div className="border-t border-white/8 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-white/50">Subtotal</span>
          <span className="font-mono text-sm text-white/70">${subtotal.toFixed(2)}</span>
        </div>
        {coupon && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-white/50">Coupon ({coupon.code})</span>
            <span className="font-mono text-sm text-blue-400">-${couponDiscount.toFixed(2)}</span>
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
