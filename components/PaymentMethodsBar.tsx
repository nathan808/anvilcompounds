import { CardNetworkLogos } from "@/components/PaymentLogos";

// Single source of the "what can I pay with" mini-display shown on the cart
// drawer, footer, and product pages. Two tiers, both reflecting only methods
// that actually work today (checkout Step 3 is the source of truth — see
// lib/paymentMethods.ts's `hidden` flag):
//   - Top line: card, via a secure payment link — live.
//   - Bottom line: the other live rails (Ethereum, Zelle). ACH and USDC/USDT
//     are deliberately NOT listed here — PayPageClient.tsx shows a disabled
//     "Not Yet Available" button for both, so claiming they're accepted would
//     be inaccurate. Add them back here once real payment collection exists.
const OTHER_METHODS: { icon: string; label: string }[] = [
  { icon: "Ξ", label: "Ethereum · 10% off" },
  { icon: "⚡", label: "Zelle" },
];

export default function PaymentMethodsBar() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-[11px] text-blue-400 tracking-[0.1em] uppercase mr-1">Card</span>
        <CardNetworkLogos />
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
