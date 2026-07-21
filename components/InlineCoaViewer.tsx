"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { isGlpCompound } from "@/lib/productTitle";

const FREEDOM_DIAGNOSTICS_URL =
  "https://freedomdiagnosticstesting.com/search-for-your-coa-based-on-the-unique-accession-number/";

interface InlineCoaViewerProps {
  productName: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
}

export default function InlineCoaViewer({ productName, imageUrl, fileUrl }: InlineCoaViewerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  if (!imageUrl && !fileUrl) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/30 font-display font-700 text-sm opacity-40 cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        COA Pending
      </button>
    );
  }

  const handleToggle = () => {
    if (!open && isGlpCompound(productName) && !isAuthenticated) {
      router.push(`/account?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-blue-500/40 hover:border-blue-400 text-blue-400 hover:text-blue-300 font-display font-700 text-sm transition-all duration-200 bg-blue-600/5 hover:bg-blue-600/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {open ? "Hide COA" : "View COA"}
      </button>

      {open && (
        <div className="mt-5 glass-card rounded-2xl overflow-hidden">
          <div className="bg-navy-900 h-[75vh]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`${productName} Certificate of Analysis`}
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe src={fileUrl ?? undefined} title={`${productName} COA`} className="w-full h-full" />
            )}
          </div>

          <div className="p-5 border-t border-white/10 flex flex-col md:flex-row md:items-center gap-4">
            <a
              href={fileUrl ?? imageUrl ?? "#"}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm transition-all duration-200 shrink-0"
            >
              Download COA
            </a>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:pl-4 sm:border-l sm:border-white/10">
              <p className="font-mono text-[11px] text-white/40 leading-relaxed">
                Search this batch&apos;s accession number in Freedom Diagnostics&apos; database to
                verify independently.
              </p>
              <a
                href={FREEDOM_DIAGNOSTICS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-display font-700 text-sm transition-all duration-200 bg-white/5 hover:bg-white/10 shrink-0 whitespace-nowrap"
              >
                Verify on Freedom Diagnostics →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
