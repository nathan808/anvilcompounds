export const VOLUME_TIERS = [
  { min: 1,  max: 1,        discount: 0,    label: "1 vial",     displayRange: "1 vial" },
  { min: 2,  max: 2,        discount: 0.05, label: "2 vials",    displayRange: "2 vials" },
  { min: 3,  max: 5,        discount: 0.10, label: "3–5 vials",  displayRange: "3–5 vials" },
  { min: 6,  max: 9,        discount: 0.15, label: "6–9 vials",  displayRange: "6–9 vials" },
  { min: 10, max: Infinity, discount: 0.25, label: "10+ vials",  displayRange: "10–999 vials" },
];

export function getVolumeDiscount(qty: number): number {
  for (const tier of VOLUME_TIERS) {
    if (qty >= tier.min && qty <= tier.max) return tier.discount;
  }
  return 0.25;
}

export function getDiscountedPrice(basePrice: number, qty: number): number {
  return parseFloat((basePrice * (1 - getVolumeDiscount(qty))).toFixed(2));
}

export function getVolumeCTAText(qty: number): string {
  if (qty >= 10) return "You're at our best rate — 25% off";
  if (qty >= 6) {
    const needed = 10 - qty;
    return `Add ${needed} more for our best rate — 25% off`;
  }
  if (qty >= 3) {
    const needed = 6 - qty;
    return `Add ${needed} more to unlock 15% off`;
  }
  if (qty === 2) return "Add 1 more to unlock 10% off";
  return "Add 1 more to unlock 5% off";
}

export function getActiveTierIndex(qty: number): number {
  for (let i = 0; i < VOLUME_TIERS.length; i++) {
    if (qty >= VOLUME_TIERS[i].min && qty <= VOLUME_TIERS[i].max) return i;
  }
  return VOLUME_TIERS.length - 1;
}
