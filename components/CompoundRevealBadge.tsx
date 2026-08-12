// Small animated callout revealing the real compound behind a renamed
// product code (e.g. "AC3R" -> "Reta / GLP3RT") — see getCompoundReveal in
// lib/productTitle.ts. Sits on a light card/hero background in both places
// it's used (catalog card, product page), so the white pulsing text lives
// inside a small dark pill rather than directly on the page background.
// Pure-CSS animation (app/globals.css), no JS loop.
export default function CompoundRevealBadge({
  compound,
  size = "sm",
}: {
  compound: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-mock-graphite font-mono uppercase tracking-[0.15em] ${
        size === "lg" ? "text-xs md:text-sm px-3 py-1" : "text-[9px] md:text-[10px] px-2 py-0.5"
      }`}
    >
      <span className="relative flex w-1.5 h-1.5 shrink-0">
        <span className="absolute inset-0 rounded-full bg-mock-cobaltLight pulse-ring" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-mock-cobaltLight" />
      </span>
      <span className="compound-reveal-pulse">{compound}</span>
    </span>
  );
}
