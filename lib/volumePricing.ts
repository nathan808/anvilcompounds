// Per-quantity volume-discount tiers (3-5 vials = 5% off, 6-9 = 10% off,
// 10+ = 15% off) apply only to vials beyond the BOGO pair — see
// lib/bogoDiscount.ts's computeBogoLineDiscount, the single source of truth
// for this math. Raised from the old 9-vial ceiling so the 10+ tier is
// actually reachable.
export const MAX_QTY_PER_ITEM = 20;
