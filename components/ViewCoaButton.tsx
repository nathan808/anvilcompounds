"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CoaModal from "@/components/CoaModal";
import { useAuth } from "@/lib/authContext";
import { isLoginGatedCompound } from "@/lib/productTitle";

interface ViewCoaButtonProps {
  productName: string;
  imageUrl?: string | null;
  fileUrl?: string | null;
}

export default function ViewCoaButton({ productName, imageUrl, fileUrl }: ViewCoaButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    // GLP compounds' COAs are gated behind login; every other compound's
    // COA stays open to guests. Same gate checkout already applies, so
    // there's no conflicting login prompt for the same reason.
    if (isLoginGatedCompound(productName) && !isAuthenticated) {
      router.push(`/account?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen(true);
  };

  if (!imageUrl && !fileUrl) {
    return (
      <button
        disabled
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-mock-surface2 border border-mock-line text-mock-sub font-display font-700 text-sm opacity-60 cursor-not-allowed"
      >
        COA Pending
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-mock-cobalt/40 hover:border-mock-cobalt text-mock-cobaltInk hover:text-mock-cobalt font-display font-700 text-sm transition-all duration-200 bg-mock-cobalt/5 hover:bg-mock-cobalt/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View COA
      </button>
      <CoaModal
        open={open}
        onClose={() => setOpen(false)}
        title={productName}
        imageUrl={imageUrl}
        fileUrl={fileUrl}
      />
    </>
  );
}
