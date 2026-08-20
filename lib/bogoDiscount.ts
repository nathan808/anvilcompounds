import { roundCurrency } from "@/lib/taxMath";

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

// Accessory/supply items excluded from the BOGO pairing:
// - 349 (Reconstitution Solution) is already bundled free with every order
//   (see FREE_GIFT_PRODUCT_ID below) and isn't meant to also consume the
//   order's one BOGO free-unit slot if a customer buys extra.
// - 1041/1043/1045/1047/1049 are the Research Bundles — already discounted
//   ~15% off the sum of their component prices, so stacking BOGO on top
//   would mean two bundles for close to half price (confirmed with the
//   store owner — bundles don't participate in BOGO).
export const BOGO_EXCLUDED_PRODUCT_IDS = new Set<number>([349, 1041, 1043, 1045, 1047, 1049]);

// Research Bundles are marked out of stock (display + functionally blocked
// from purchase, both catalog UI and app/api/checkout/place-order) — same 5
// IDs as the bundle portion of BOGO_EXCLUDED_PRODUCT_IDS above, pulled out
// on its own since this isn't a BOGO concept and 349 (Bacteriostatic Water)
// isn't a bundle.
export const BUNDLE_PRODUCT_IDS = new Set<number>([1041, 1043, 1045, 1047, 1049]);

export interface BogoLineItem {
  quantity: number;
  unitPrice: number;
  // WC regular_price for this line's product/variation — the crossed-out
  // "Base" price. A B1G1 pair must always total exactly this Base price
  // (e.g. KLOW: 2 vials for $119, the Base, not 2x the discounted single
  // price) — see the pricing table this was built from. Falls back to
  // unitPrice when unavailable so an old caller that hasn't been updated
  // yet degrades to "1 unit free at current price" instead of crashing.
  regularPrice?: number;
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

// Discount needed so the qualifying line's first pair totals exactly its
// Base (regular_price), not just "1 unit free at whatever it currently
// sells for". E.g. unitPrice $94, regularPrice $119: discount = 2x94-119 =
// $69, leaving $119 for the pair — any units beyond the first pair (qty > 2)
// still cost unitPrice each, undiscounted (only one pair per checkout).
export function computeBogoDiscount(items: BogoLineItem[]): number {
  const index = getBogoLineIndex(items);
  if (index === -1) return 0;
  const { unitPrice, regularPrice } = items[index];
  const base = regularPrice ?? unitPrice;
  return roundCurrency(2 * unitPrice - base);
}

// Free gift, bundled with every order (not tied to the BOGO pairing above) —
// a real WC line item at $0 so it shows up on the packing slip for
// fulfillment, not just a cosmetic discount line.
export const FREE_GIFT_PRODUCT_ID = 349;
export const FREE_GIFT_VARIATION_ID = 350;
export const FREE_GIFT_LABEL = "Bacteriostatic Water (3mL) — Free Gift";
