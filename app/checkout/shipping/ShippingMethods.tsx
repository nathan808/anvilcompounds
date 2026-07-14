"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";

interface ShippingOption {
  methodId: string;
  instanceId: string;
  title: string;
  cost: number;
  originalCost: number | null;
  estimate: string;
}

export default function ShippingMethods() {
  const { subtotal } = useCart();
  const { coupon, shipping, setShipping } = useCheckout();
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [error, setError] = useState("");

  const discount = computeCouponDiscount(subtotal, coupon);
  const postCouponSubtotal = subtotal - discount;

  useEffect(() => {
    let cancelled = false;
    setError("");
    setOptions(null);

    const params = new URLSearchParams({
      subtotal: postCouponSubtotal.toFixed(2),
      hasCoupon: coupon ? "true" : "false",
    });

    fetch(`/api/checkout/shipping-methods?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.error) {
          setError("Could not load shipping methods. Please refresh and try again.");
          return;
        }
        setOptions(data.methods);
      })
      .catch(() => { if (!cancelled) setError("Could not load shipping methods. Please refresh and try again."); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postCouponSubtotal, coupon?.code]);

  if (error) {
    return <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">{error}</div>;
  }

  if (!options) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
        No shipping methods are configured for your area. Contact support@anvilcompounds.shop.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const key = `${opt.methodId}:${opt.instanceId}`;
        const selected = shipping && `${shipping.methodId}:${shipping.instanceId}` === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setShipping({ methodId: opt.methodId, instanceId: opt.instanceId, title: opt.title, cost: opt.cost })}
            className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-200 ${
              selected ? "border-blue-500 bg-blue-600/10" : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-blue-500" : "border-white/25"}`}>
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </div>
              <div>
                <p className="font-display font-700 text-white text-sm">{opt.title}</p>
                {opt.estimate && <p className="font-mono text-xs text-white/35 mt-0.5">{opt.estimate}</p>}
              </div>
            </div>
            <div className="text-right shrink-0">
              {opt.originalCost !== null ? (
                <>
                  <p className="font-mono text-xs text-white/30 line-through">${opt.originalCost.toFixed(2)}</p>
                  <p className="font-display font-700 text-blue-400 text-sm">$0.00</p>
                </>
              ) : (
                <p className="font-display font-700 text-white text-sm">${opt.cost.toFixed(2)}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
