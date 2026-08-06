"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeVolumeDiscount } from "@/lib/volumeDiscount";
import { computeBogoDiscount } from "@/lib/bogoDiscount";
import { FreeShippingProgress as FreeShippingProgressData } from "@/lib/useFreeShippingProgress";
import FreeShippingProgress from "@/components/FreeShippingProgress";

interface ShippingOption {
  methodId: string;
  instanceId: string;
  title: string;
  cost: number;
  originalCost: number | null;
  estimate: string;
}

export default function ShippingMethods() {
  const { items, subtotal } = useCart();
  const { coupon, shipping, setShipping, hydrated: checkoutHydrated } = useCheckout();
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [freeShipping, setFreeShipping] = useState<FreeShippingProgressData | null>(null);
  const [error, setError] = useState("");

  const bogoDiscount = computeBogoDiscount(items.map((i) => ({ quantity: i.quantity, unitPrice: i.price })));
  const bogoActive = bogoDiscount > 0;
  const discount = bogoActive ? 0 : computeCouponDiscount(subtotal, coupon);
  const postCouponSubtotal = subtotal - discount;
  // Compounding base — matches place-order/route.ts's discountedSubtotal,
  // which is what free-shipping eligibility is actually evaluated against.
  const volumeDiscount = bogoActive ? 0 : computeVolumeDiscount(subtotal, !!coupon);
  const discountedSubtotal = postCouponSubtotal - volumeDiscount - bogoDiscount;

  useEffect(() => {
    // Guard against a real race, not just a style nit: on a fresh page load,
    // CartProvider (localStorage) and CheckoutProvider (sessionStorage)
    // hydrate independently. Without waiting for checkoutHydrated, this
    // effect can run while `shipping` is still its pre-hydration `null` —
    // the resync check below sees nothing to correct, checkoutContext then
    // finishes hydrating a moment later with the STALE selection, and since
    // that alone doesn't change discountedSubtotal/coupon, this effect never
    // reruns to catch it. Confirmed live: without this guard, a stale free
    // ($0) Ground selection survived a full navigation to this page with a
    // shrunk cart. Re-fetching once more after hydration finishes is a
    // second, harmless network call in the case where shipping was already
    // hydrated in time — the real fix is not skipping it when it wasn't.
    if (!checkoutHydrated) return;
    let cancelled = false;
    setError("");
    setOptions(null);

    const params = new URLSearchParams({
      subtotal: discountedSubtotal.toFixed(2),
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
        const freshOptions: ShippingOption[] = data.methods;
        setOptions(freshOptions);
        setFreeShipping(data.freeShipping ?? null);

        // Re-sync any already-selected shipping (persisted in sessionStorage,
        // so it survives across separate carts in the same tab) against the
        // options we just fetched for the CURRENT subtotal. A method whose
        // cost changed (e.g. Ground was free at $200+, isn't at $50) gets its
        // stored cost corrected in place; a method that no longer exists gets
        // cleared entirely, which re-disables "Continue to Payment" until the
        // customer re-selects — otherwise a stale cost (most often a stale
        // $0 "free shipping") rides through to the payment step and produces
        // a client/server total mismatch ("Your cart has changed").
        if (shipping) {
          const stillValid = freshOptions.find(
            (o) => o.methodId === shipping.methodId && o.instanceId === shipping.instanceId
          );
          if (!stillValid) {
            setShipping(null);
          } else if (stillValid.cost !== shipping.cost) {
            setShipping({ methodId: stillValid.methodId, instanceId: stillValid.instanceId, title: stillValid.title, cost: stillValid.cost });
          }
        }
      })
      .catch(() => { if (!cancelled) setError("Could not load shipping methods. Please refresh and try again."); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutHydrated, discountedSubtotal, coupon?.code]);

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
    <div className="space-y-4">
      <FreeShippingProgress data={freeShipping} subtotal={subtotal} hasCoupon={!!coupon || bogoActive} />

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
