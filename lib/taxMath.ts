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
// total, EACH fee line (payment-method discount, volume discount — every
// negative fee line WC sees on the order, even ones created with
// tax_status: "none"), and shipping are each taxed and rounded
// independently as their own WC_Order_Item_Fee, then summed. Verified
// against live test orders with a single fee line (549-554); with two fee
// lines simultaneously (volume + payment-method discount), each is still
// its own independent WC_Order_Item_Fee under the hood, so the same
// per-line-rounding mechanism applies — re-verify against a real order
// before trusting this without the CRITICAL total-match check.
export function computeTax(
  rate: number,
  postCouponSubtotal: number,
  feeAmounts: number[],
  shippingCost: number,
  shippingTaxable: boolean
): TaxBreakdown {
  const productTax = roundCurrency(postCouponSubtotal * rate);
  const feeTax = roundCurrency(
    feeAmounts.reduce((sum, amount) => sum + (amount !== 0 ? roundCurrency(-amount * rate) : 0), 0)
  );
  const shippingTax = shippingTaxable ? roundCurrency(shippingCost * rate) : 0;
  return {
    productTax,
    feeTax,
    shippingTax,
    totalTax: roundCurrency(productTax + feeTax + shippingTax),
  };
}
