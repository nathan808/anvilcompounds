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
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-6xl h-[96vh] md:h-[94vh] glass-card rounded-2xl overflow-hidden flex flex-col"
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="px-5 py-3 border-t border-white/10 shrink-0 flex justify-end">
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
