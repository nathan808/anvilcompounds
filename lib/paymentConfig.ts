// ─── PAYMENT DETAILS CONFIGURATION ────────────────────────────────────────────
// Update these values when banking accounts are finalized.
// Every payment block on the order confirmation page reads from this object.
// ──────────────────────────────────────────────────────────────────────────────

export const PAYMENT_DETAILS = {
  zelle: {
    handle: "TO_BE_CONFIGURED",          // e.g. "payments@anvilcompounds.shop"
    recipientName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–4 hours during business hours.",
  },
  cashapp: {
    cashtag: "TO_BE_CONFIGURED",         // e.g. "$AnvilCompounds"
    recipientName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–4 hours during business hours.",
  },
  applecash: {
    phone: "TO_BE_CONFIGURED",           // e.g. "+1 (800) 000-0000"
    recipientName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–4 hours during business hours.",
  },
  ach: {
    bankName: "TO_BE_CONFIGURED",        // e.g. "Mercury Bank"
    routingNumber: "TO_BE_CONFIGURED",
    accountNumber: "TO_BE_CONFIGURED",
    accountType: "Checking",
    beneficiaryName: "Anvil Compounds LLC",
    timeline: "Confirmed within 1–3 business days.",
    discount: "10% off your next order",
  },
  crypto: {
    provider: "NOWPayments",
    note: "AUTO_GENERATED_BY_NOWPAYMENTS", // wallet address is generated per order
    supportedCoins: "USDC, USDT, BTC, ETH",
    timeline: "Confirmed after 1–3 network confirmations (typically under 30 min).",
    discount: "10% off your next order",
  },
} as const;

export const HOLD_DAYS = 7;
export const SUPPORT_EMAIL = "support@anvilcompounds.shop";
