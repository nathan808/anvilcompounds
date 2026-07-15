# Anvil Checkout Spec
Step 1 cart+info → Step 2 shipping → Step 3 payment select
→ [order created in WooCommerce, status "on-hold"] → per-method payment page
→ Vercel confirmation page

Order is created ONLY when the customer lands on the payment page — not before.

## Shipping (flat, weight-independent)
| Method   | Cost   |
|----------|--------|
| Ground   | $9.99  |
| 2-Day    | $19.99 |
| Overnight| $49.99 |
Free Ground on orders over $150. 2-Day and Overnight are never free.
Threshold evaluated on post-coupon, PRE-payment-discount subtotal.
Shipping is never discounted.
Shipping methods are read from the WooCommerce REST API. Never hardcode in Next.js.

## Payment methods
Group 1 — Card
  stripe    | Card             | $0 (baseline price) | PLACEHOLDER integration
Group 2 — Instant (lead with these)
  ethereum  | Ethereum         | -10% | LIVE — Bankful hosted page
  echeck    | E-check          | -10% | LIVE — Bankful hosted page (promoted from PLACEHOLDER; both share createPaymentLink())
  usdc_usdt | USDC / USDT      | -5%  | PLACEHOLDER — NOWPayments
  ach       | ACH transfer     | -5%  | PLACEHOLDER — LinkMoney
Group 3 — Manual
  zelle     | Zelle            | 0%   | LIVE — $2,000 per-order cap

NO card surcharge. Card is the posted baseline; other rails are discounts off it.

## Discount math
1. Apply coupon (if any) to subtotal.
2. Volume Discount — automatic 10% off subtotal when subtotal >= $200
   (`lib/volumeDiscount.ts`: `VOLUME_DISCOUNT_THRESHOLD`/`VOLUME_DISCOUNT_PERCENT`).
   Mutually exclusive with coupons: any valid coupon suppresses this entirely,
   even if the coupon is worth less. Independent of the (unrelated) $150
   free-shipping threshold — the two are NOT tied together.
   Recorded as its own NEGATIVE fee line: name "Volume Discount", tax_status: none.
   Like the payment-method discount, this is a fee line, NOT a WC coupon — it
   must never reduce the product line_items' own subtotal/total sent to WC
   (only a real coupon does that). Folding it into that value double-counts
   the reduction and mismatches WC's real total (hit this exact bug once,
   verified via a live order — see `place-order/route.ts`'s postCouponSubtotal
   vs discountedSubtotal comment).
3. Apply payment-method % to the subtotal EXCLUDING shipping, compounding on
   top of the Volume Discount if both apply (Volume Discount off subtotal
   first, THEN payment-method % off what's left — same "discountedSubtotal"
   base used for the free-shipping-threshold check).
4. Record as a NEGATIVE fee line item on the WooCommerce order:
   name: "Payment method discount (<Method>)", total: negative value, tax_status: none
5. Coupons never stack with each other. Neither the payment discount nor the
   Volume Discount is a coupon.
6. Tax: each fee line (Volume Discount, payment-method discount) is taxed
   independently and rounded per-line, same as before — see the Tax section.
   `lib/taxMath.ts`'s `computeTax()` takes an array of fee amounts now, not a
   single one, to support both fee lines applying simultaneously.

## Order lifecycle
on-hold at creation → auto-cancel if unpaid after 3 days
→ "processing" on payment confirmation (webhook, or manual for Zelle)
- The 3-day figure is `ORDER_HOLD_DAYS` in `lib/paymentConfig.ts`, read by the
  pay/confirmation pages. It is intentionally separate from the older
  `HOLD_DAYS` constant (7) in the same file, which the single-step
  `app/order-confirmation` page still reads — that's a different, pre-existing
  policy for a different flow, left alone rather than reconciled.
- No auto-cancel cron/job exists yet — only the hold-expiry *display* is
  implemented. Actually cancelling unpaid on-hold orders after 3 days is not
  built.

## Zelle rules
- Cap: $2,000 per order. Above this, the Zelle card is disabled with
  "Contact support@anvilcompounds.shop for orders over $2,000".
- Customer instruction MUST say: state the ORDER NUMBER only. Never mention
  the product, compound name, or any description.

## Statement descriptor
Bankful transactions settle under "Anvil Holdings LLC". Every Bankful payment
page and the invoice email must say:
"Your bank statement will show a charge from Anvil Holdings LLC. This is our
payment processing partner."

## Compliance (non-negotiable, do not alter)
- RUO + 21+ checkbox required at Step 1. Exact text:
  "I confirm that all products purchased are for research use only and not for
  human or veterinary consumption. I am 21 years of age or older."
- No product names, compound names, or research-chemical language on ANY
  payment page or in any payment descriptor/metadata.
## Tax
- This store has WooCommerce tax calculation enabled (`woocommerce_calc_taxes:
  "yes"`). Currently one rate is configured: CA, 7.25%, and it applies to
  shipping too (the rate's `shipping` flag is `true`). Other states currently
  have no rate and are untaxed.
- The rate is READ LIVE from `/wc/v3/taxes` (`lib/wcTax.ts`) — never hardcode
  "7.25" or "CA" in Next.js. If a rate is added/changed/removed in WooCommerce,
  checkout picks it up automatically.
- WooCommerce rounds tax PER LINE, not once at the order/subtotal level
  (`woocommerce_tax_round_at_subtotal: "no"` on this store). Reverse-engineered
  from live order data, WC computes and rounds tax on each of these amounts
  independently, then sums:
  1. the post-coupon product total (subtotal − coupon discount — NOT further
     reduced by the Volume Discount or payment-method discount; those are fee
     lines, not coupons, so they never touch this value)
  2. EACH fee line present (Volume Discount, payment-method discount — yes,
     WC taxes these too, even though created with `tax_status: "none"`;
     empirically each still gets taxed as its own proportional reduction of
     the taxable base). Zero, one, or both may be present on a given order.
  3. shipping (only if the matched rate's `shipping` flag is true)
- Each amount is rounded to the cent independently (half away from
  zero — PHP's `round()`, not JS's `Math.round()`, which rounds `-0.5` the
  wrong way) before being summed into the order's total tax.
- `lib/taxMath.ts` (the rounding + composition formula) and `lib/wcTax.ts`
  (the live rate lookup) are the ONLY place this logic may live. Both the
  checkout UI (Order Summary tax row) and the order-creation route
  (`app/api/checkout/place-order/route.ts`) call these same two functions —
  never reimplement tax math elsewhere.
- Verified against 6 live test orders across all payment methods (with and
  without a coupon applied): server-computed totals matched WooCommerce's
  totals to the cent.

## Config constants
All payment details live in ONE file: /lib/paymentConfig.ts
export const PAYMENT_CONFIG = {
  zelle: { phone: "(619) 653-4735", maxOrder: 2000, status: "live" },
  ethereum: { status: "live" },
  echeck: { status: "placeholder" },
  usdc_usdt: { status: "placeholder" },
  ach: { status: "placeholder" },
  stripe: { status: "placeholder" },
}
