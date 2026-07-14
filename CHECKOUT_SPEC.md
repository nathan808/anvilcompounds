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
  echeck    | E-check          | -10% | PLACEHOLDER — Bankful hosted page
  usdc_usdt | USDC / USDT      | -5%  | PLACEHOLDER — NOWPayments
  ach       | ACH transfer     | -5%  | PLACEHOLDER — LinkMoney
Group 3 — Manual
  zelle     | Zelle            | 0%   | LIVE — $2,000 per-order cap

NO card surcharge. Card is the posted baseline; other rails are discounts off it.

## Discount math
1. Apply coupon (if any) to subtotal.
2. Apply payment-method % to the post-coupon subtotal, EXCLUDING shipping.
3. Record as a NEGATIVE fee line item on the WooCommerce order:
   name: "Payment method discount (<Method>)", total: negative value, tax_status: none
4. Coupons never stack with each other. Payment discount is not a coupon.

## Order lifecycle
on-hold at creation → auto-cancel if unpaid after 3 days
→ "processing" on payment confirmation (webhook, or manual for Zelle)

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
## Config constants
All payment details live in ONE file: /lib/paymentConfig.ts
export const PAYMENT_CONFIG = {
  zelle: { phone: "(619) 653-4735", maxOrder: 2000 },
  ethereum: { status: "live" },
  echeck: { status: "placeholder" },
  usdc_usdt: { status: "placeholder" },
  ach: { status: "placeholder" },
  stripe: { status: "placeholder" },
}
