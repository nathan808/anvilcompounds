// Per-quantity volume-discount tiers (3-5 vials = 5% off, 6-9 = 10% off)
// were removed in favor of the simple 2-tier Base/B1G1/Single pricing model
// (lib/bogoDiscount.ts) — no more per-unit price scaling by quantity. This
// constant remains as the general cart-line quantity ceiling (used by
// BOGO-excluded products like bundles, which keep a plain numeric stepper).
export const MAX_QTY_PER_ITEM = 9;
