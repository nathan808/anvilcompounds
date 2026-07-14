// PHP's round() rounds half away from zero; JS's Math.round rounds -0.5 toward
// zero. WooCommerce's tax math is PHP-side, so cents landing exactly on a half
// (common with clean 5%/10% discounts against a 7.25% rate) round differently
// unless we match PHP's behavior here.
export function roundCurrency(n: number): number {
  const sign = n < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(n) * 100 + 1e-9) / 100;
}

export interface TaxBreakdown {
  productTax: number;
  feeTax: number;
  shippingTax: number;
  totalTax: number;
}

// Mirrors WooCommerce's own tax calculation with per-line rounding (this store
// has woocommerce_tax_round_at_subtotal = "no"): the post-coupon product
// total, the payment-method discount fee, and shipping are each taxed and
// rounded independently, then summed. This matches WC's calculate_totals()
// to the cent — verified against live test orders (549-554).
export function computeTax(
  rate: number,
  postCouponSubtotal: number,
  paymentDiscountAmount: number,
  shippingCost: number,
  shippingTaxable: boolean
): TaxBreakdown {
  const productTax = roundCurrency(postCouponSubtotal * rate);
  const feeTax = paymentDiscountAmount > 0 ? roundCurrency(-paymentDiscountAmount * rate) : 0;
  const shippingTax = shippingTaxable ? roundCurrency(shippingCost * rate) : 0;
  return {
    productTax,
    feeTax,
    shippingTax,
    totalTax: roundCurrency(productTax + feeTax + shippingTax),
  };
}
