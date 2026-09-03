// Same "strip the compound names, keep the numbers" idea used for size
// labels throughout the product page — a blend's raw WC attribute label
// ("5mg BPC-157 + 5mg TB-500") is too long next to the price, so this
// collapses it to "5mg + 5mg". Single-component sizes ("10mg") already
// read fine and pass through as-is.
export function simplifySizeLabel(size: string): string {
  const matches = Array.from(size.matchAll(/([\d.]+)\s*mg/gi));
  if (matches.length < 2) return size;
  return matches.map((m) => `${m[1]}mg`).join(" + ");
}
