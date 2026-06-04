"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cartContext";
import CartDrawer from "@/components/CartDrawer";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Catalog", href: "/#catalog" },
    { label: "How We Test", href: "/#testing" },
    { label: "Why Anvil", href: "/#trust" },
    { label: "Journal", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/#footer" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-navy-950/90 backdrop-blur-xl border-b border-blue-600/10 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded bg-blue-600 rotate-45 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-[3px] rounded bg-navy-950 rotate-45" />
              <div className="absolute inset-[6px] rounded bg-blue-600/80 rotate-45" />
            </div>
            <span className="font-display font-700 text-xl tracking-tight text-white">
              ANVIL<span className="text-blue-400 font-400 text-sm tracking-[0.2em] ml-1">COMPOUNDS</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body text-sm text-white/60 hover:text-white animated-underline transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA + Cart */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs font-mono text-blue-400/70 tracking-widest uppercase">
              Research Use Only
            </span>
            <a
              href="/#catalog"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-display font-600 rounded transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30"
            >
              View Catalog
            </a>
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all duration-200"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-mono rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={openCart}
              className="relative p-2 text-white/50 hover:text-white"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-mono rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
            <button
              className="flex flex-col gap-1.5 p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-navy-900/95 backdrop-blur-xl border-t border-blue-600/10"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-white/70 hover:text-white font-body text-sm py-1 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="/#catalog"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-display font-600 rounded text-center"
                >
                  View Catalog
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <CartDrawer />
    </>
  );
}
