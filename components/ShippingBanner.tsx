const ITEMS = [
  { icon: "📍", text: "Southern California" },
  { icon: "🚚", text: "USPS Priority" },
  { icon: "📦", text: "2–3 Business Days" },
  { icon: "⚡", text: "Same-Day Dispatch by 12 PM PST" },
];

// Dark variant — for navy-background sections (product pages, catalog)
function DarkBanner() {
  return (
    <div className="w-full rounded-xl border border-blue-500/20 bg-blue-600/8 px-4 md:px-6 py-3.5 md:py-4">
      {/* Top row — headline */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        <p className="font-mono text-[10px] md:text-xs text-blue-400 tracking-[0.2em] uppercase">
          Domestic · Reliable · Accountable
        </p>
      </div>
      {/* Bottom row — shipping details */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            <span className="text-[13px] leading-none">{item.icon}</span>
            <span className="font-body text-xs md:text-sm text-white/55">{item.text}</span>
            {i < ITEMS.length - 1 && (
              <span className="ml-3 text-white/15 hidden sm:inline">·</span>
            )}
          </div>
        ))}
      </div>
      {/* Sub-note */}
      <p className="mt-2 font-mono text-[9px] md:text-[10px] text-white/25 tracking-wide">
        All orders ship from our SoCal facility · Free standard packaging · Discrete shipping
      </p>
    </div>
  );
}

// Light variant — for the hero section (light blue-grey background)
function LightBanner() {
  return (
    <div className="w-full rounded-xl border border-blue-300/50 bg-blue-100/60 backdrop-blur-sm px-4 md:px-6 py-3 md:py-3.5">
      {/* Top row */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        <p className="font-mono text-[10px] text-blue-700 tracking-[0.2em] uppercase">
          Domestic · Reliable · Accountable
        </p>
      </div>
      {/* Details row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            <span className="text-[12px] leading-none">{item.icon}</span>
            <span className="font-body text-xs text-blue-900/70">{item.text}</span>
            {i < ITEMS.length - 1 && (
              <span className="ml-2.5 text-blue-300 hidden sm:inline">·</span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-1.5 font-mono text-[9px] text-blue-600/50 tracking-wide">
        All orders ship from our SoCal facility · Discrete shipping
      </p>
    </div>
  );
}

export default function ShippingBanner({ theme = "dark" }: { theme?: "dark" | "light" }) {
  return theme === "light" ? <LightBanner /> : <DarkBanner />;
}
