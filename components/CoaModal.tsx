"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { simplifySizeLabel } from "@/lib/reconstitution";

interface CoaModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
  // Optional per-size switcher — pass all three (from the COA library, for
  // a multi-size product) to show pills that swap `fileUrl` without closing
  // the modal. Omitted entirely on the product page, where size selection
  // already lives in the buy column and this modal just shows whichever
  // size's COA the page already resolved.
  sizes?: string[];
  selectedSizeIndex?: number;
  onSelectSize?: (index: number) => void;
}

export default function CoaModal({
  open,
  onClose,
  title,
  imageUrl,
  fileUrl,
  sizes,
  selectedSizeIndex = 0,
  onSelectSize,
}: CoaModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-2 pt-6 md:p-6 md:pt-10 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Anchored to the top of the viewport (not vertically centered)
              and sized ~10% smaller than before (was w-full/96vh) — on
              mobile the footer's Close/Download row used to sit right at
              the bottom edge of the screen, overlapping the browser's own
              back-gesture/UI chrome. Shrinking + top-anchoring pushes that
              row well clear of it. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[90%] max-w-6xl h-[86vh] md:h-[85vh] glass-card rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 gap-4 flex-wrap">
              <h3 className="font-display font-700 text-white text-sm tracking-wide">
                {title} — Certificate of Analysis
              </h3>

              <div className="flex items-center gap-3">
                {sizes && sizes.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {sizes.map((size, i) => (
                      <button
                        key={size}
                        onClick={() => onSelectSize?.(i)}
                        className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-500 transition-all duration-200 ${
                          i === selectedSizeIndex
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                        }`}
                      >
                        {simplifySizeLabel(size)}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-navy-950">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={`${title} Certificate of Analysis`}
                  className="w-full h-full object-contain"
                />
              ) : fileUrl ? (
                <iframe src={fileUrl} title={`${title} COA`} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-sm">
                  COA not available
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-white/10 shrink-0 flex items-center justify-between gap-4">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
              <a
                href={fileUrl ?? imageUrl ?? "#"}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Download original →
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
