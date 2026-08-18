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
// has woocommerce_tax_round_at_subtotal = "no"): EACH order line — every
// product line item, EACH fee line (payment-method discount, volume
// discount, BOGO — every negative fee line WC sees on the order, even ones
// created with tax_status: "none"), and shipping — is taxed and rounded
// independently as its own WC_Order_Item, then summed.
//
// productLineAmounts must be each PRODUCT line's own taxable subtotal
// (after that line's share of any coupon discount, before BOGO/volume/
// payment-method fees, which are handled separately via feeAmounts) — NOT
// a single combined cart subtotal. Rounding one combined number instead of
// summing each line's own rounded tax is off by a cent whenever a cart has
// 2+ product lines whose individual roundings don't sum to the same cent
// as the combined rounding (confirmed against real order #1113: WC's
// per-line product tax summed to $23.28, while rounding the $321.00
// combined subtotal at 7.25% gives $23.27 — the exact TOTAL_MISMATCH this
// was built to fix. See lib/couponMath.ts's apportionAmount for how a
// coupon's discount is split across lines before this).
export function computeTax(
  rate: number,
  productLineAmounts: number[],
  feeAmounts: number[],
  shippingCost: number,
  shippingTaxable: boolean
): TaxBreakdown {
  const productTax = roundCurrency(
    productLineAmounts.reduce((sum, amount) => sum + (amount !== 0 ? roundCurrency(amount * rate) : 0), 0)
  );
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

// Splits `total` proportionally across `weights` (e.g. each product line's
// share of the cart subtotal), in whole cents, using a largest-remainder
// method so the parts always sum to exactly `total` — mirrors how
// WooCommerce apportions a cart-level coupon discount across order line
// items before taxing each one independently.
export function apportionAmount(total: number, weights: number[]): number[] {
  const totalCents = Math.round(total * 100);
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (totalCents === 0 || weightSum === 0) return weights.map(() => 0);

  const raw = weights.map((w) => (w / weightSum) * totalCents);
  const floors = raw.map((r) => Math.floor(r));
  const remainder = totalCents - floors.reduce((s, f) => s + f, 0);

  const order = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac);

  const cents = [...floors];
  for (let k = 0; k < remainder; k++) {
    cents[order[k % order.length].i] += 1;
  }
  return cents.map((c) => c / 100);
}
