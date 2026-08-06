// Launch promo: "Buy 1 Get 1 Free" — same product/variation only. For every 2
// units of the same line, the 2nd unit is free. When active on an order it is
// the ONLY discount in effect: it suppresses coupons, the $200+ Volume
// Discount, and the payment-method (crypto/ACH) discount entirely (confirmed
// with the store owner — exactly one discount mechanism at a time).
//
// Single kill switch — flip to false and redeploy to end the promo. No date
// logic; the store owner will ask for it to be turned off when the launch
// window ends.
export const BOGO_ENABLED = true;
export const BOGO_LABEL = "Buy 1 Get 1 Free";

export interface BogoLineItem {
  quantity: number;
  unitPrice: number;
}

export function computeBogoDiscount(items: BogoLineItem[]): number {
  if (!BOGO_ENABLED) return 0;
  return items.reduce((sum, item) => sum + Math.floor(item.quantity / 2) * item.unitPrice, 0);
}

// Free gift, bundled with every order (not tied to the BOGO pairing above) —
// a real WC line item at $0 so it shows up on the packing slip for
// fulfillment, not just a cosmetic discount line.
export const FREE_GIFT_PRODUCT_ID = 349;
export const FREE_GIFT_VARIATION_ID = 350;
export const FREE_GIFT_LABEL = "Bacteriostatic Water (30mL) — Free Gift";
