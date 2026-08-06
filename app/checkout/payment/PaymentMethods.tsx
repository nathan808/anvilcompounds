"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeTax } from "@/lib/taxMath";
import { computeVolumeDiscount } from "@/lib/volumeDiscount";
import { computeBogoDiscount, BOGO_LABEL } from "@/lib/bogoDiscount";
import { PAYMENT_METHODS, GROUP_LABELS, GROUP_SUBHEADS, GROUP_ORDER } from "@/lib/paymentMethods";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";
import { CardNetworkLogos } from "@/components/PaymentLogos";

// Pre-selection explainer for the card/invoice method — must be visible
// BEFORE the buyer picks it, not after (that's what makes the follow-up
// step read as a security feature instead of a stalled checkout).
function CardExplainer() {
  return (
    <div className="mt-3 ml-8 space-y-2.5 p-4 rounded-lg bg-white/[0.03] border border-white/8">
      <p className="font-body text-xs text-white/55 leading-relaxed">
        Place your order now — nothing is charged yet. A secure payment link
        arrives by email within 15 minutes. Card details are entered on our
        processor&apos;s page, never on this site.
      </p>
      <p className="font-body text-xs text-white/55 leading-relaxed">
        Your order is placed and your lots are held. Nothing is charged until you
        pay the invoice.
      </p>
      <p className="font-mono text-[10px] text-white/30 leading-relaxed">
        If it doesn&apos;t arrive, check spam and add support@anvilcompounds.shop to your contacts.
      </p>
      <CardNetworkLogos className="pt-1" />
    </div>
  );
}

export default function PaymentMethods() {
  const { items, subtotal } = useCart();
  const { coupon, shipping, paymentMethodId, setPaymentMethodId, step1 } = useCheckout();
  const [taxRate, setTaxRate] = useState(0);
  const [shippingTaxable, setShippingTaxable] = useState(false);

  useEffect(() => {
    if (!step1.state) { setTaxRate(0); setShippingTaxable(false); return; }
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
  }, [step1.state]);

  // Naming matches OrderSummary.tsx / place-order/route.ts exactly: postCouponSubtotal
  // (coupon only) is the WC product-line tax base; discountedSubtotal (coupon +
  // volume discount) is the compounding base the payment-method % applies to.
  // Passing the wrong one into computeTax would double-count the volume discount
  // (taxed once via the fee-line array below, again via a shrunk product base) —
  // see CHECKOUT_SPEC.md's postCouponSubtotal-vs-discountedSubtotal note.
  const bogoDiscount = computeBogoDiscount(items.map((i) => ({ quantity: i.quantity, unitPrice: i.price })));
  const bogoActive = bogoDiscount > 0;

  const couponDiscount = bogoActive ? 0 : computeCouponDiscount(subtotal, coupon);
  const postCouponSubtotal = subtotal - couponDiscount;
  const volumeDiscount = bogoActive ? 0 : computeVolumeDiscount(subtotal, !!coupon);
  const discountedSubtotal = postCouponSubtotal - volumeDiscount - bogoDiscount;
  const shippingCost = shipping?.cost ?? 0;

  return (
    <div className="space-y-8">
      {GROUP_ORDER.map((group) => {
        const methods = PAYMENT_METHODS.filter((m) => m.group === group && !m.hidden);
        if (methods.length === 0) return null;
        return (
          <div key={group}>
            <h3 className="font-display font-700 text-white mb-1">{GROUP_LABELS[group]}</h3>
            {GROUP_SUBHEADS[group] && (
              <p className="font-body text-xs text-white/40 mb-4">{GROUP_SUBHEADS[group]}</p>
            )}
            <div className={GROUP_SUBHEADS[group] ? "space-y-3 mt-4" : "space-y-3"}>
              {methods.map((method) => {
                const discountAmount = bogoActive ? 0 : discountedSubtotal * (method.discountPercent / 100);
                const tax = computeTax(taxRate, postCouponSubtotal, [volumeDiscount, discountAmount, bogoDiscount], shippingCost, shippingTaxable);
                const methodTotal = discountedSubtotal - discountAmount + shippingCost + tax.totalTax;
                const isLive = PAYMENT_CONFIG[method.id].status === "live";
                const overZelleCap = method.id === "zelle" && methodTotal > PAYMENT_CONFIG.zelle.maxOrder;
                const selected = paymentMethodId === method.id;

                return (
                  <div key={method.id}>
                    <button
                      type="button"
                      disabled={overZelleCap}
                      onClick={() => setPaymentMethodId(method.id)}
                      className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-200 ${
                        overZelleCap
                          ? "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed"
                          : selected
                          ? "border-blue-500 bg-blue-600/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-blue-500" : "border-white/25"}`}>
                          {selected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display font-700 text-white text-sm">{method.label}</p>
                            {method.discountPercent > 0 && !bogoActive && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono text-[10px] tracking-wide">
                                {method.discountPercent}% off
                              </span>
                            )}
                            {method.discountPercent > 0 && bogoActive && (
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/40 font-mono text-[10px] tracking-wide">
                                Included in {BOGO_LABEL}
                              </span>
                            )}
                            {method.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-mono text-[9px] tracking-widest uppercase">
                                {method.badge}
                              </span>
                            )}
                            {isLive && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-mono text-[9px] tracking-widest uppercase">
                                Live
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[11px] text-white/30 mt-1">{method.todoNote}</p>
                          {overZelleCap && (
                            <p className="font-body text-xs text-red-400 mt-1">
                              Contact support@anvilcompounds.shop for orders over ${PAYMENT_CONFIG.zelle.maxOrder.toLocaleString()}.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-700 text-white text-base">${methodTotal.toFixed(2)}</p>
                        <p className="font-mono text-[9px] text-white/25 tracking-wide">tax incl.</p>
                      </div>
                    </button>
                    {method.id === "bacs" && <CardExplainer />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
