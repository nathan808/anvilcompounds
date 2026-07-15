// Single source of the "what can I pay with" mini-display shown on product
// pages, the cart drawer, and (in prose form) the FAQ. Two tiers:
//   - Top line: card networks + wallets Stripe will cover once that
//     integration ships (lib/paymentMethods.ts: "stripe" is still
//     status: "placeholder" — nothing here is live yet, hence "Coming soon").
//     Text/badge placeholders only, deliberately not real brand logos —
//     there are no logo image assets in this repo, and fabricating or
//     hotlinking official trademarked marks isn't something to guess at.
//     Swap in real logo images once they're provided or Stripe ships.
//   - Bottom line: every other method in lib/paymentMethods.ts, live or not
//     (Ethereum, E-check, Zelle are live; USDC/USDT, ACH are placeholders) —
//     matches what checkout Step 3 already shows, so this never drifts from
//     what the real checkout offers.
const STRIPE_TOP_LINE = ["Visa", "Mastercard", "Amex", "Discover", "Apple Pay", "Google Pay", "Link"];

const OTHER_METHODS: { icon: string; label: string }[] = [
  { icon: "Ξ", label: "Ethereum" },
  { icon: "✓", label: "E-check" },
  { icon: "⚡", label: "Zelle" },
  { icon: "₮", label: "USDC/USDT" },
  { icon: "🏦", label: "ACH" },
];

export default function PaymentMethodsBar() {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-center font-mono text-[8px] text-white/20 tracking-[0.15em] uppercase mb-1">
          Card via Stripe · Coming soon
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {STRIPE_TOP_LINE.map((name) => (
            <span
              key={name}
              className="px-2 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px] text-white/40 tracking-wide whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {OTHER_METHODS.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="text-xs">{icon}</span>
            <span className="font-mono text-[9px] text-white/30 tracking-wide">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
