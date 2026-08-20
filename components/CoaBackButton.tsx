"use client";

import { useRouter } from "next/navigation";

// Browser-history back — returns to whichever page (product page or
// catalog) the visitor actually came from, rather than a hardcoded link.
// Kept in the normal top-of-page flow (not fixed/sticky) so it never
// overlaps Safari's bottom toolbar/back-forward gesture area on mobile.
export default function CoaBackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-[#AEBBD0] hover:text-white transition-colors mb-4"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back
    </button>
  );
}
