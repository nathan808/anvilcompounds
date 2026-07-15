"use client";

import { useEffect, useState } from "react";

export interface FreeShippingProgress {
  eligible: boolean;
  remaining: number;
  threshold: number;
}

// Thin client-side wrapper around /api/checkout/shipping-methods for callers
// that only need the free-shipping teaser, not the actual method list
// (cart drawer, Step 1, Step 3). Step 2 (ShippingMethods.tsx) already fetches
// this same endpoint for its method list and reads freeShipping off that
// response directly — it does not use this hook, to avoid a second redundant
// fetch of the same data.
export function useFreeShippingProgress(subtotal: number, hasCoupon: boolean, enabled = true): FreeShippingProgress | null {
  const [progress, setProgress] = useState<FreeShippingProgress | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProgress(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      subtotal: subtotal.toFixed(2),
      hasCoupon: hasCoupon ? "true" : "false",
    });

    fetch(`/api/checkout/shipping-methods?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setProgress(data.freeShipping ?? null); })
      .catch(() => { if (!cancelled) setProgress(null); });

    return () => { cancelled = true; };
  }, [subtotal, hasCoupon, enabled]);

  return progress;
}
