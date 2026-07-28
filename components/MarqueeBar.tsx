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
    <div className="relative overflow-hidden bg-mock-graphite py-3">
      <div className="marquee-track flex gap-6 w-max">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-6 shrink-0">
            <span className="font-mono text-xs text-[#DCE3EE] tracking-[0.16em] uppercase whitespace-nowrap">
              {item}
            </span>
            <span className="text-mock-cobaltLight text-xs">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
