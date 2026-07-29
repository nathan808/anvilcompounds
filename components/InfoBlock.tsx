"use client";

import { useState } from "react";

// A single collapsible content block within the product page's combined
// info section (01 What it is / 02 Mechanism / 03 Properties) — label row
// toggles the body open/closed so long sections don't force a big scroll
// on every product page.
export default function InfoBlock({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 mb-5 px-4 py-3 rounded-lg border transition-colors ${
          open
            ? "border-transparent bg-transparent px-0 py-0"
            : "border-mock-line bg-mock-surface2 hover:bg-mock-line/40"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-px bg-mock-cobalt" />
          <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
            {number} / {label}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-mock-cobaltInk shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}
