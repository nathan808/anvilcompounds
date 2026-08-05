"use client";

import { useState } from "react";
import { faqs } from "@/lib/faqData";

// Light-theme (mock-*) FAQ accordion for product pages — same content as
// /learn's FAQ tab (lib/faqData.ts is the single shared source), restyled to
// match the product page's InfoBlock design language instead of the dark
// checkout/learn theme.
function CategoryAccordion({ category, items }: { category: string; items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="bg-white border border-mock-line rounded-2xl overflow-hidden">
      <div className="px-6 md:px-8 py-4 bg-mock-graphite">
        <span className="font-mono text-[11px] font-700 text-gray-300 tracking-[0.2em] uppercase">{category}</span>
      </div>
      <div className="divide-y divide-mock-line">
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-4 px-6 md:px-8 py-4 text-left hover:bg-mock-surface2 transition-colors"
              >
                <span className="font-body text-sm text-mock-navy">{item.q}</span>
                <svg
                  className={`w-4 h-4 text-mock-cobaltInk shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open && (
                <div className="px-6 md:px-8 pb-5">
                  <p className="font-body text-sm text-mock-sub leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductFaqBlock() {
  return (
    <div className="space-y-4">
      {faqs.map((group) => (
        <CategoryAccordion key={group.category} category={group.category} items={group.items} />
      ))}
    </div>
  );
}
