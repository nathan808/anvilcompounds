import { FreeShippingProgress as FreeShippingProgressData } from "@/lib/useFreeShippingProgress";
import { VOLUME_DISCOUNT_THRESHOLD, VOLUME_DISCOUNT_PERCENT } from "@/lib/volumeDiscount";

interface Props {
  data: FreeShippingProgressData | null;
  subtotal: number;
  hasCoupon?: boolean;
  label?: string;
}

interface Row {
  key: string;
  eligible: boolean;
  remaining: number;
  threshold: number;
  unlockedText: string;
  pendingLabel: string;
}

function ProgressRow({ row }: { row: Row }) {
  if (row.eligible) {
    return <p className="font-body text-sm text-blue-300">✓ {row.unlockedText}</p>;
  }
  const pct = Math.min(100, Math.max(0, ((row.threshold - row.remaining) / row.threshold) * 100));
  return (
    <div className="space-y-2">
      <p className="font-body text-sm text-white/60">
        Add <span className="text-blue-400 font-600">${row.remaining.toFixed(2)}</span> more to unlock{" "}
        <span className="text-white/80">{row.pendingLabel}</span>
      </p>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Single source of both spend-more-save-more teasers shown throughout
// checkout: free shipping (data — live from WC, via ShippingMethods.tsx's
// own fetch or useFreeShippingProgress elsewhere) and the volume discount
// (subtotal/hasCoupon — a pure Next.js-side constant, no WC lookup needed,
// since it's not a WC coupon or shipping rule). The two have independent
// $150/$200 thresholds, so each renders as its own row rather than one
// merged bar. The volume-discount row is omitted entirely when a coupon is
// active, since computeVolumeDiscount() returns 0 in that case regardless
// of subtotal — nothing to show progress toward.
export default function FreeShippingProgress({ data, subtotal, hasCoupon = false, label = "free Ground shipping" }: Props) {
  const shippingRow: Row | null = data && {
    key: "shipping",
    eligible: data.eligible,
    remaining: data.remaining,
    threshold: data.threshold,
    unlockedText: `You've unlocked ${label}`,
    pendingLabel: label,
  };

  const volumeRow: Row | null = hasCoupon ? null : {
    key: "volume",
    eligible: subtotal >= VOLUME_DISCOUNT_THRESHOLD,
    remaining: Math.max(0, VOLUME_DISCOUNT_THRESHOLD - subtotal),
    threshold: VOLUME_DISCOUNT_THRESHOLD,
    unlockedText: `You've unlocked ${VOLUME_DISCOUNT_PERCENT}% off your order`,
    pendingLabel: `${VOLUME_DISCOUNT_PERCENT}% off your order`,
  };

  const rows = [shippingRow, volumeRow].filter((r): r is Row => r !== null);
  if (rows.length === 0) return null;

  return (
    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
      {rows.map((row, i) => (
        <div key={row.key} className={i > 0 ? "pt-3 border-t border-white/8" : ""}>
          <ProgressRow row={row} />
        </div>
      ))}
    </div>
  );
}
