"use client";

import { useState } from "react";

interface SdsPreviewButtonProps {
  productName: string;
  propertiesTable: { label: string; value: string }[];
}

// SDS/Technical Research Guide PDFs are drafted and shipped with every
// order (email + package insert) -- not hosted as a public URL, so there's
// nothing here for a crawler to read or flag. This button only shows a
// preview built from data we already publish elsewhere on the page (CAS,
// formula, MW, appearance, storage), then locks the rest behind "purchase
// to unlock" rather than linking to a real file.
const PREVIEW_LABELS = ["CAS Number", "Molecular Formula", "Molecular Weight", "Appearance", "Storage"];

const LOCKED_SECTIONS = [
  "Hazard Identification",
  "Handling & Storage",
  "Exposure Controls / Personal Protection",
  "Stability & Reactivity",
];

export default function SdsPreviewButton({ productName, propertiesTable }: SdsPreviewButtonProps) {
  const [open, setOpen] = useState(false);

  const previewRows = propertiesTable.filter((row) => PREVIEW_LABELS.includes(row.label));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/50 hover:text-white/80 font-display font-700 text-sm transition-all duration-200 bg-white/5 hover:bg-white/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008zM3.75 5.25h16.5v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V5.25z" />
        </svg>
        View SDS Preview
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-card rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase mb-1">
                  Safety Data Sheet — Preview
                </p>
                <h3 className="font-display font-700 text-white text-lg">{productName}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Unlocked basic info */}
              <div className="rounded-xl border border-white/8 divide-y divide-white/5 overflow-hidden">
                {previewRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-mono text-[10px] text-white/35 tracking-widest uppercase">{row.label}</span>
                    <span className="font-mono text-xs text-white/70">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Locked sections */}
              <div className="relative rounded-xl border border-white/8 overflow-hidden">
                <div className="divide-y divide-white/5 blur-[3px] select-none pointer-events-none">
                  {LOCKED_SECTIONS.map((section) => (
                    <div key={section} className="px-4 py-2.5">
                      <span className="font-mono text-[10px] text-white/30 tracking-widest uppercase">{section}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-navy-950/70 flex flex-col items-center justify-center gap-2 text-center px-4">
                  <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="font-mono text-[10px] text-blue-300 tracking-[0.15em] uppercase">
                    Purchase to unlock full SDS
                  </p>
                </div>
              </div>

              <p className="font-mono text-[10px] text-white/30 text-center leading-relaxed">
                Full Safety Data Sheet + Technical Research Guide included with every order.
              </p>

              <button
                onClick={() => setOpen(false)}
                className="w-full text-center py-3 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm rounded-xl transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
