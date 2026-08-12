// Small animated callout revealing the real compound behind a renamed
// product code (e.g. "AC3R" -> "Retatrutide") — see getCompoundReveal in
// lib/productTitle.ts. Pure-CSS shimmer (app/globals.css), no JS animation
// loop, so it's cheap to render on every catalog card.
export default function CompoundRevealBadge({
  compound,
  size = "sm",
}: {
  compound: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.15em] ${
        size === "lg" ? "text-xs md:text-sm" : "text-[9px] md:text-[10px]"
      }`}
    >
      <span className="relative flex w-1.5 h-1.5 shrink-0">
        <span className="absolute inset-0 rounded-full bg-mock-cobalt pulse-ring" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-mock-cobalt" />
      </span>
      <span className="compound-reveal-shimmer font-700">{compound}</span>
    </span>
  );
}
