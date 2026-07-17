"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cartContext";
import CartDrawer from "@/components/CartDrawer";

// pushDown: true on pages that also render a fixed compliance bar above the
// navbar (checkout flow) — both are fixed to the viewport, so without this
// they'd stack at the same top:0 position instead of one pushing the other
// down. Height (h-7 / top-7, 28px) must match the compliance bar's own h-7.
export default function Navbar({ pushDown = false }: { pushDown?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Catalog", href: "/catalog?catalog=full" },
    { label: "COAs", href: "/coas" },
    { label: "Journal", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/#footer" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed ${pushDown ? "top-7" : "top-0"} left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-navy-950/90 backdrop-blur-xl border-b border-blue-600/10 py-2"
            : "bg-transparent py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center group">
            <span className="font-logo font-700 text-xl tracking-tight text-white">
              ANVIL<span className="text-blue-400 font-600 text-sm tracking-[0.2em] ml-1">COMPOUNDS</span>
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
              href="/catalog?catalog=full"
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
              <span className={`block w-6 h-0.5 bg-blue-400 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-blue-400 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-blue-400 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
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
              className="md:hidden bg-navy-950 border-t border-blue-600/20"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-white hover:text-blue-400 font-body text-sm py-1 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="/catalog?catalog=full"
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
