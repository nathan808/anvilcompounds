"use client";

import { useState } from "react";

interface SdsPreviewButtonProps {
  productName: string;
}

// SDS/Technical Research Guide PDFs are drafted and shipped with every
// order (email + package insert) -- not hosted as a public URL, so there's
// nothing here for a crawler to read or flag. Just a short description of
// what's included, no preview content to gate behind a purchase.
export default function SdsPreviewButton({ productName }: SdsPreviewButtonProps) {
  const [open, setOpen] = useState(false);

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
                  Safety Data Sheet
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
              <p className="font-body text-sm text-white/60 leading-relaxed">
                A Safety Data Sheet (SDS) documents handling, storage, and hazard information for
                this compound. A full SDS and a technical/research reference guide are included
                with every purchase.
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
