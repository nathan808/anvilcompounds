// Automatic "spend more, save more" discount — distinct from both coupons
// and the payment-method discount. Confirmed with the store owner:
// - Threshold: $200 subtotal, independent of the (unrelated, live-from-WC)
//   $150 free-shipping threshold — the two are NOT tied together.
// - Mutually exclusive with coupons: any valid coupon suppresses this
//   entirely, even if the coupon is worth less to the customer.
// - Compounds with the payment-method discount the same way a coupon does:
//   this comes off the subtotal FIRST, then the payment-method % applies to
//   what's left (see place-order/route.ts).
export const VOLUME_DISCOUNT_THRESHOLD = 200;
export const VOLUME_DISCOUNT_PERCENT = 10;
export const VOLUME_DISCOUNT_LABEL = "Volume Discount";

export function computeVolumeDiscount(subtotal: number, hasCoupon: boolean): number {
  if (hasCoupon) return 0;
  if (subtotal < VOLUME_DISCOUNT_THRESHOLD) return 0;
  return subtotal * (VOLUME_DISCOUNT_PERCENT / 100);
}
