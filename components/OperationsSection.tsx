import SciIcon, { type SciIconName } from "@/components/SciIcon";

const SHIPPING: { icon: SciIconName; label: string; detail: string }[] = [
  { icon: "clock",       label: "Order cutoff", detail: "Orders placed before 12 PM PT ship the same day." },
  { icon: "truck",       label: "Carrier",      detail: "USPS Priority Mail, usually 2–5 business days within the U.S." },
  { icon: "tag",         label: "Tracking",     detail: "You'll get a tracking number as soon as your order ships." },
  { icon: "box",         label: "Packaging",    detail: "Plain, discreet outer packaging on every order." },
  { icon: "thermometer", label: "On arrival",   detail: "Store vials at 2–8 °C, away from light, until you're ready to use them." },
  { icon: "shield",      label: "Damaged order", detail: "Email us and we'll ship a replacement within 48 hours." },
];

export default function OperationsSection() {
  return (
    <section className="relative bg-mock-page py-16 md:py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-px bg-mock-cobalt" />
            <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
              Shipping · Southern California
            </span>
          </div>
          <h2 className="font-display font-700 text-mock-navy text-2xl md:text-3xl mb-3">
            How your order ships
          </h2>
          <p className="font-body text-mock-sub leading-relaxed max-w-2xl">
            Every order is packed and shipped from our facility in Southern California. Here&rsquo;s
            what to expect after you check out.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {SHIPPING.map((row) => (
            <div key={row.label} className="bg-white border border-mock-line rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-2 text-mock-cobaltInk">
                <SciIcon name={row.icon} />
                <span className="font-mono text-[11px] text-mock-sub tracking-[0.15em] uppercase">{row.label}</span>
              </div>
              <p className="font-body text-sm text-mock-navy leading-relaxed">{row.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href="/account?tab=tracking"
            className="px-5 py-2.5 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-600 text-sm rounded-lg transition-colors"
          >
            Track an Order
          </a>
          <a
            href="/legal/shipping-policy"
            className="px-5 py-2.5 border border-mock-line hover:border-mock-cobalt text-mock-cobaltInk font-display font-600 text-sm rounded-lg transition-colors bg-white"
          >
            Shipping Policy →
          </a>
        </div>
      </div>
    </section>
  );
}
