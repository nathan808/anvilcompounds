import { FreeShippingProgress as FreeShippingProgressData } from "@/lib/useFreeShippingProgress";

interface Props {
  data: FreeShippingProgressData | null;
  label?: string;
}

// Single source of the free-shipping teaser UI — used by ShippingMethods.tsx
// (Step 2, fed from its own fetch), and via useFreeShippingProgress by the
// cart drawer, Step 1, and Step 3. Renders nothing if there's no amount-based
// free-shipping rule to show progress toward (data === null).
export default function FreeShippingProgress({ data, label = "free Ground shipping" }: Props) {
  if (!data) return null;

  if (data.eligible) {
    return (
      <div className="px-4 py-3 rounded-xl bg-blue-600/10 border border-blue-500/30">
        <p className="font-body text-sm text-blue-300">✓ You&apos;ve unlocked {label}</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, ((data.threshold - data.remaining) / data.threshold) * 100));

  return (
    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
      <p className="font-body text-sm text-white/60">
        Add <span className="text-blue-400 font-600">${data.remaining.toFixed(2)}</span> more to unlock{" "}
        <span className="text-white/80">{label}</span>
      </p>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
