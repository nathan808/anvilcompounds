// Shared parsing for the Reconstitution Guide — sums every "Xmg" occurrence
// in a size label (handles both single vials like "80mg" and multi-component
// blends like "5mg/5mg") to get the vial's total peptide content. Labels
// with no parseable mg (e.g. Bacteriostatic Water's "30mL × 1") are dropped
// rather than guessed at.

export const BW_VOLUMES_ML = [1, 2, 3];

export interface ReconVial {
  size: string;
  // Short display label derived from the matched mg amounts rather than the
  // raw size string — e.g. "5mg BPC-157 + 5mg TB-500" (the WC attribute
  // label, kept full elsewhere for the size selector) becomes "(5mg + 5mg)"
  // here so multi-component blend headings stay compact.
  label: string;
  totalMg: number;
}

export function parseReconVials(sizes: string[]): ReconVial[] {
  return sizes
    .map((size): ReconVial | null => {
      const matches = Array.from(size.matchAll(/([\d.]+)\s*mg/gi));
      if (!matches.length) return null;
      const amounts = matches.map((m) => parseFloat(m[1]));
      const totalMg = amounts.reduce((sum, n) => sum + n, 0);
      if (!Number.isFinite(totalMg) || totalMg <= 0) return null;
      const label =
        amounts.length > 1
          ? `(${amounts.map((n) => `${n}mg`).join(" + ")})`
          : `${amounts[0]}mg`;
      return { size, label, totalMg };
    })
    .filter((v): v is ReconVial => v !== null);
}
