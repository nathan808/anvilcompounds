// Shared parsing for the Reconstitution Guide — sums every "Xmg" occurrence
// in a size label (handles both single vials like "80mg" and multi-component
// blends like "5mg/5mg") to get the vial's total peptide content. Labels
// with no parseable mg (e.g. Bacteriostatic Water's "30mL × 1") are dropped
// rather than guessed at.

export const BW_VOLUMES_ML = [1, 2, 3];

export interface ReconVial {
  size: string;
  totalMg: number;
}

export function parseReconVials(sizes: string[]): ReconVial[] {
  return sizes
    .map((size): ReconVial | null => {
      const matches = Array.from(size.matchAll(/([\d.]+)\s*mg/gi));
      if (!matches.length) return null;
      const totalMg = matches.reduce((sum, m) => sum + parseFloat(m[1]), 0);
      return Number.isFinite(totalMg) && totalMg > 0 ? { size, totalMg } : null;
    })
    .filter((v): v is ReconVial => v !== null);
}
