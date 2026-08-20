"use client";

import { useState } from "react";
import { simplifySizeLabel } from "@/lib/reconstitution";

interface CoaGuideViewerProps {
  title: string;
  documentationImage?: string | null;
  sizes: string[];
  sizesDocumentationFiles: (string | null)[];
  initialSizeIndex: number;
}

// Same image/PDF-vs-image logic as the old CoaModal, just laid out inline on
// the page instead of as an overlay — sized to the page column, not the
// viewport, so it never reads as "zoomed in" regardless of device.
export default function CoaGuideViewer({
  title,
  documentationImage,
  sizes,
  sizesDocumentationFiles,
  initialSizeIndex,
}: CoaGuideViewerProps) {
  const [sizeIndex, setSizeIndex] = useState(
    initialSizeIndex >= 0 && initialSizeIndex < sizesDocumentationFiles.length ? initialSizeIndex : 0
  );
  const fileUrl = sizesDocumentationFiles[sizeIndex] ?? sizesDocumentationFiles[0] ?? null;
  // Several COAs are scanned/exported as flat .jpg/.png rather than a PDF
  // (e.g. Selank, Semax, NAD+, GLOW, CJC-1295+Ipamorelin, Tesamorelin,
  // MOTS-c, AC2T) — those were coming through `fileUrl` and rendering in
  // the <iframe> below, which shows an image at native pixel size with no
  // scaling at all (unlike a PDF, an <iframe> doesn't apply any "fit"
  // behavior to a raw image), reading as badly zoomed in. Route anything
  // with an image extension through the same <img object-contain> path as
  // `documentationImage`, regardless of which field it came from.
  const isImageFile = /\.(jpe?g|png|gif|webp)$/i.test(fileUrl ?? "");
  const imageUrl = documentationImage ?? (isImageFile ? fileUrl : null);
  const pdfUrl = isImageFile ? null : fileUrl;

  return (
    <div className="bg-white border border-mock-line rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-mock-line gap-4 flex-wrap">
        <h2 className="font-display font-700 text-mock-navy text-sm tracking-wide">
          {title} — Certificate of Analysis
        </h2>
        {sizes.length > 1 && (
          <div className="flex items-center gap-1.5">
            {sizes.map((size, i) => (
              <button
                key={size}
                onClick={() => setSizeIndex(i)}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-500 transition-all duration-200 ${
                  i === sizeIndex
                    ? "bg-mock-cobalt border-mock-cobaltInk text-white"
                    : "bg-mock-surface2 border-mock-line text-mock-sub hover:text-mock-navy hover:border-mock-cobalt/30"
                }`}
              >
                {simplifySizeLabel(size)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[52vh] md:h-[65vh] bg-mock-graphite relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${title} Certificate of Analysis`}
            className="w-full h-full object-contain"
          />
        ) : pdfUrl ? (
          // #view=Fit forces the browser's native PDF viewer to frame the
          // whole page in the iframe instead of its own "Automatic Zoom"
          // default, which was rendering some COAs zoomed in past the
          // container edges.
          <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&view=Fit`} title={`${title} COA`} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-sm">
            COA not available
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-mock-line flex items-center justify-end">
        <a
          href={fileUrl ?? imageUrl ?? "#"}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-mock-cobaltInk hover:text-mock-cobalt transition-colors"
        >
          Download original →
        </a>
      </div>
    </div>
  );
}
