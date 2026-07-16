// Single source of the "what can I pay with" mini-display shown on product
// pages, the cart drawer, and (in prose form) the FAQ. Two tiers:
//   - Top line: Stripe (card) + Apple Pay, both "coming soon" — no logo
//     images, since there are no real brand-logo assets in this repo and
//     fabricating/hotlinking official trademarked marks isn't something to
//     guess at. Swap in real logo images once they're provided or Stripe ships.
//   - Bottom line: every other method in lib/paymentMethods.ts, live or not
//     (Ethereum, E-check, Zelle are live; USDC/USDT, ACH are placeholders) —
//     matches what checkout Step 3 already shows, so this never drifts from
//     what the real checkout offers.
const OTHER_METHODS: { icon: string; label: string }[] = [
  { icon: "Ξ", label: "Ethereum" },
  { icon: "✓", label: "E-check" },
  { icon: "⚡", label: "Zelle" },
  { icon: "₮", label: "USDC/USDT" },
  { icon: "🏦", label: "ACH" },
];

export default function PaymentMethodsBar() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="font-mono text-[11px] text-blue-400 tracking-[0.1em] uppercase">
          Card via Stripe · Coming soon
        </span>
        <span className="font-mono text-[11px] text-blue-400 tracking-[0.1em] uppercase flex items-center gap-1.5">
          <span className="text-sm leading-none">🍎</span> Apple Pay · Coming soon
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {OTHER_METHODS.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="text-sm">{icon}</span>
            <span className="font-mono text-[11px] text-blue-300 tracking-wide">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
