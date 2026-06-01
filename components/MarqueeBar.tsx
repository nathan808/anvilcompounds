"use client";

export default function MarqueeBar() {
  const items = [
    "HPLC Verified",
    "Mass Spectrometry Confirmed",
    "Endotoxin Screened",
    "99%+ Purity",
    "Same-Day Dispatch",
    "Southern California",
    "COA On Every Batch",
    "Research Grade Only",
  ];

  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden bg-blue-600/10 border-y border-blue-600/20 py-3">
      <div className="marquee-track flex gap-12 w-max">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-4 shrink-0">
            <span className="font-mono text-xs text-blue-300 tracking-[0.2em] uppercase whitespace-nowrap">
              {item}
            </span>
            <span className="w-1 h-1 rounded-full bg-blue-600 opacity-60" />
          </span>
        ))}
      </div>
    </div>
  );
}
