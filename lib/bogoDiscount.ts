// Launch promo: "Buy 1 Get 1 Free" — same product/variation only, and capped
// at ONE free unit per checkout (order-wide, not per line — confirmed with
// the store owner). The first line item with quantity >= 2 (in cart order)
// is the one that earns the free unit; additional pairs, whether on that
// same line or any other, don't stack further discount. When active on an
// order it is the ONLY discount in effect: it suppresses coupons, the $200+
// Volume Discount, and the payment-method (crypto/ACH) discount entirely
// (confirmed with the store owner — exactly one discount mechanism at a time).
//
// Single kill switch — flip to false and redeploy to end the promo. No date
// logic; the store owner will ask for it to be turned off when the launch
// window ends.
export const BOGO_ENABLED = true;
export const BOGO_LABEL = "Buy 1 Get 1 Free";

// Accessory/supply items excluded from the BOGO pairing — currently just the
// Reconstitution Solution (WC id 349), which is already bundled free with
// every order (see FREE_GIFT_PRODUCT_ID below) and isn't meant to also
// consume the order's one BOGO free-unit slot if a customer buys extra.
export const BOGO_EXCLUDED_PRODUCT_IDS = new Set<number>([349]);

export interface BogoLineItem {
  quantity: number;
  unitPrice: number;
  productId?: number;
}

// Index of the single line item (cart order) that carries the one-per-
// checkout free unit, or -1 if no line qualifies (every line has qty < 2,
// or the only qualifying lines are BOGO-excluded products). Exported
// separately from computeBogoDiscount so per-line UI (cart drawer) can show
// the "applied" state on the correct line and nowhere else.
export function getBogoLineIndex(items: BogoLineItem[]): number {
  if (!BOGO_ENABLED) return -1;
  return items.findIndex(
    (item) => item.quantity >= 2 && !BOGO_EXCLUDED_PRODUCT_IDS.has(item.productId ?? -1)
  );
}

export function computeBogoDiscount(items: BogoLineItem[]): number {
  const index = getBogoLineIndex(items);
  return index === -1 ? 0 : items[index].unitPrice;
}

// Free gift, bundled with every order (not tied to the BOGO pairing above) —
// a real WC line item at $0 so it shows up on the packing slip for
// fulfillment, not just a cosmetic discount line.
export const FREE_GIFT_PRODUCT_ID = 349;
export const FREE_GIFT_VARIATION_ID = 350;
export const FREE_GIFT_LABEL = "Bacteriostatic Water (3mL) — Free Gift";
