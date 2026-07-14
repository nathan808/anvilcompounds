// ─── PAYMENT DETAILS CONFIGURATION ────────────────────────────────────────────
// Update these values when banking accounts are finalized.
// Every payment block on the order confirmation page reads from this object.
// ──────────────────────────────────────────────────────────────────────────────

export const PAYMENT_DETAILS = {
  zelle: {
    handle: process.env.ZELLE_ADDRESS ?? "TO_BE_CONFIGURED",
    recipientName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–4 hours during business hours.",
  },
  cashapp: {
    cashtag: process.env.CASHAPP_HANDLE ? `$${process.env.CASHAPP_HANDLE}` : "TO_BE_CONFIGURED",
    recipientName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–4 hours during business hours.",
  },
  applecash: {
    phone: "TO_BE_CONFIGURED",           // add APPLE_CASH_PHONE env var when ready
    recipientName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–4 hours during business hours.",
  },
  ach: {
    bankName: "TO_BE_CONFIGURED",
    routingNumber: "TO_BE_CONFIGURED",
    accountNumber: "TO_BE_CONFIGURED",
    accountType: "Checking",
    beneficiaryName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–3 business days.",
    discount: "10% off your next order",
  },
  crypto: {
    provider: "NOWPayments",
    note: "AUTO_GENERATED_BY_NOWPAYMENTS",
    supportedCoins: "USDC, USDT, BTC, ETH",
    timeline: "Confirmed after 1–3 network confirmations (typically under 30 min).",
    discount: "10% off your next order",
  },
} as const;

export const HOLD_DAYS = 7;
export const SUPPORT_EMAIL = "support@anvilcompounds.shop";

// ─── CHECKOUT_SPEC.md config constants ─────────────────────────────────────
// Per-spec status flags for the multi-step checkout (Step 3 payment method
// selection). Kept alongside PAYMENT_DETAILS above rather than replacing it —
// app/order-confirmation/page.tsx still reads PAYMENT_DETAILS/HOLD_DAYS/
// SUPPORT_EMAIL, and removing them would break that page's build.
// ──────────────────────────────────────────────────────────────────────────────

export const PAYMENT_CONFIG = {
  zelle: { phone: "(619) 653-4735", maxOrder: 2000 },
  ethereum: { status: "live" },
  echeck: { status: "placeholder" },
  usdc_usdt: { status: "placeholder" },
  ach: { status: "placeholder" },
  stripe: { status: "placeholder" },
} as const;
