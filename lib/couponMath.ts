import { CheckoutCoupon } from "@/lib/checkoutContext";

// Coupon discount applies to the cart subtotal only — shipping is never discounted.
export function computeCouponDiscount(subtotal: number, coupon: CheckoutCoupon | null): number {
  if (!coupon) return 0;
  const raw = coupon.discountType === "percent"
    ? subtotal * (coupon.amount / 100)
    : coupon.amount;
  return Math.min(raw, subtotal);
}
