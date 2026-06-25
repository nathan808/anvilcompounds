"use client";

import { motion } from "framer-motion";

const POLICY_PAGES = [
  { label: "Privacy Policy",  href: "/legal/privacy-policy" },
  { label: "Terms of Use",    href: "/legal/terms-of-use" },
  { label: "Cookie Policy",   href: "/legal/cookie-policy" },
  { label: "Return Policy",   href: "/legal/return-policy" },
  { label: "Shipping Policy", href: "/legal/shipping-policy" },
];

export default function Footer() {
  const links: Record<string, { label: string; href: string }[]> = {
    Catalog: [
      { label: "BPC-157",      href: "/products/bpc-157" },
      { label: "T1rz",         href: "/products/t1rz" },
      { label: "R3ta",         href: "/products/r3ta" },
      { label: "KLOW",         href: "/products/klow" },
      { label: "GHK-Cu",       href: "/products/ghk-cu" },
      { label: "TB-500",       href: "/products/tb-500" },
      { label: "MOTS-c",       href: "/products/mots-c" },
    ],
    Testing: [
      { label: "How We Test",          href: "/#testing" },
      { label: "HPLC Process",         href: "/#testing" },
      { label: "Mass Spectrometry",    href: "/#testing" },
      { label: "Endotoxin Screening",  href: "/#testing" },
      { label: "COA Verification",     href: "/#testing" },
    ],
    Company: [
      { label: "About Anvil",      href: "/about" },
      { label: "Why Anvil",        href: "/#trust" },
      { label: "Research Journal", href: "/blog" },
      { label: "FAQ",              href: "/faq" },
      { label: "Contact",          href: "/#footer" },
    ],
  };

  return (
    <footer id="footer" className="relative bg-navy-950 border-t border-blue-600/10 overflow-hidden">
      {/* Top gradient line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Main footer content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded bg-blue-600 rotate-45" />
                <div className="absolute inset-[3px] rounded bg-navy-950 rotate-45" />
                <div className="absolute inset-[6px] rounded bg-blue-600/80 rotate-45" />
              </div>
              <span className="font-display font-700 text-xl text-white tracking-tight">
                ANVIL<span className="text-blue-400 font-400 text-sm tracking-[0.2em] ml-1">COMPOUNDS</span>
              </span>
            </div>
            <p className="font-body text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
              Research-grade compounds independently verified to 99%+ purity through triple-method
              testing. Based in Southern California.
            </p>

            {/* Contact */}
            <a
              href="mailto:support@anvilcompounds.shop"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-mono text-xs tracking-wider transition-colors animated-underline mb-4"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
              </svg>
              support@anvilcompounds.shop
            </a>

            {/* Phone */}
            <a
              href="tel:6196534735"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-mono text-xs tracking-wider transition-colors animated-underline mb-4"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              (619) 653-4735
            </a>

            {/* Address */}
            <div className="flex items-start gap-2 font-mono text-xs text-white/30 tracking-wider leading-relaxed">
              <svg className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                8690 Aero Dr Ste 115 #1173<br />
                San Diego, CA 92123
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-mono text-xs text-blue-400/70 tracking-[0.2em] uppercase mb-5">
                {section}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="font-body text-sm text-white/35 hover:text-white/70 transition-colors animated-underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Legal / Policies column */}
          <div>
            <h4 className="font-mono text-xs text-blue-400/70 tracking-[0.2em] uppercase mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {POLICY_PAGES.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="font-body text-sm text-white/35 hover:text-white/70 transition-colors animated-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer block */}
        <div className="py-8 border-t border-white/5">
          <div className="p-5 rounded-xl bg-navy-800/50 border border-white/5 mb-8">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-5 h-5 rounded-full border border-yellow-500/50 flex items-center justify-center mt-0.5">
                <span className="text-yellow-400 text-xs font-bold">!</span>
              </div>
              <p className="font-mono text-xs text-white/30 leading-relaxed tracking-wide">
                All products on this site are for <strong className="text-white/50">in vitro laboratory and research use only</strong>.
                They are not intended for use in humans, animals, or for any therapeutic, diagnostic, or clinical application.
                You must be <strong className="text-white/50">21 years of age or older</strong> to purchase.
                By ordering, you confirm that you are a qualified researcher using these compounds in a licensed research facility.
                Anvil Compounds makes no claims regarding the safety, efficacy, or legality of any compound for human use.
              </p>
            </div>
          </div>

          {/* Billing notice */}
          <p className="font-mono text-xs text-white/30 text-center mb-6">
            All transactions will appear on your statement as <span className="text-white/50">Anvil Holdings LLC</span>
          </p>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs text-white/20">
              © {new Date().getFullYear()} Anvil Compounds. All rights reserved. San Diego, CA.
            </p>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {POLICY_PAGES.slice(0, 3).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="font-mono text-xs text-white/25 hover:text-white/50 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
