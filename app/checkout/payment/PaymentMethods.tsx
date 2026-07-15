"use client";

import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeVolumeDiscount } from "@/lib/volumeDiscount";
import { PAYMENT_METHODS, GROUP_LABELS, GROUP_ORDER } from "@/lib/paymentMethods";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";

export default function PaymentMethods() {
  const { subtotal } = useCart();
  const { coupon, shipping, paymentMethodId, setPaymentMethodId } = useCheckout();

  const couponDiscount = computeCouponDiscount(subtotal, coupon);
  const volumeDiscount = computeVolumeDiscount(subtotal, !!coupon);
  const postCouponSubtotal = subtotal - couponDiscount - volumeDiscount;
  const shippingCost = shipping?.cost ?? 0;

  return (
    <div className="space-y-8">
      {GROUP_ORDER.map((group) => {
        const methods = PAYMENT_METHODS.filter((m) => m.group === group);
        return (
          <div key={group}>
            <h3 className="font-display font-700 text-white mb-4">{GROUP_LABELS[group]}</h3>
            <div className="space-y-3">
              {methods.map((method) => {
                const discountAmount = postCouponSubtotal * (method.discountPercent / 100);
                const methodTotal = postCouponSubtotal - discountAmount + shippingCost;
                const isLive = PAYMENT_CONFIG[method.id].status === "live";
                const overZelleCap = method.id === "zelle" && methodTotal > PAYMENT_CONFIG.zelle.maxOrder;
                const selected = paymentMethodId === method.id;

                return (
                  <button
                    key={method.id}
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
                        <div className="flex items-center gap-2">
                          <p className="font-display font-700 text-white text-sm">{method.label}</p>
                          {method.discountPercent > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono text-[10px] tracking-wide">
                              {method.discountPercent}% off
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
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
