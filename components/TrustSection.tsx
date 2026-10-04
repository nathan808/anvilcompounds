import SciIcon, { type SciIconName } from "@/components/SciIcon";

const REASONS: { icon: SciIconName; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "Independent testing",
    body: "Testing is done by third-party labs, not in-house, so results can't be adjusted to get a lot through.",
  },
  {
    icon: "document",
    title: "A COA for every lot",
    body: "Every order comes with the Certificate of Analysis for the lot you actually receive, covering all three tests.",
  },
  {
    icon: "truck",
    title: "Same-day dispatch",
    body: "Order before 12 PM PT and it ships that day by USPS Priority Mail, with tracking.",
  },
  {
    icon: "mail",
    title: "Real support",
    body: "Email us on a weekday and you'll hear back the same day. If an order arrives damaged, we ship a replacement within 48 hours.",
  },
];

export default function TrustSection() {
  return (
    <section id="trust" className="relative bg-mock-page border-b border-mock-line py-16 md:py-20 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-px bg-mock-cobalt" />
            <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
              004 / Why Anvil
            </span>
          </div>
          <h2 className="font-display font-700 text-mock-navy text-2xl md:text-3xl mb-3">
            Built around one standard
          </h2>
          <p className="font-body text-mock-sub leading-relaxed max-w-2xl">
            Anyone can print &ldquo;99% pure&rdquo; on a label. We&rsquo;d rather show you the data,
            so here&rsquo;s how we work.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {REASONS.map((r) => (
            <div key={r.title} className="bg-white border border-mock-line rounded-xl p-5 flex gap-4">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-mock-surface2 border border-mock-line flex items-center justify-center text-mock-cobaltInk">
                <SciIcon name={r.icon} />
              </div>
              <div>
                <h3 className="font-display font-600 text-mock-navy text-base mb-1">{r.title}</h3>
                <p className="font-body text-sm text-mock-sub leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
