"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import { useFreeShippingProgress } from "@/lib/useFreeShippingProgress";
import FreeShippingProgress from "@/components/FreeShippingProgress";
import PaymentMethodsBar from "@/components/PaymentMethodsBar";

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQty, itemCount, subtotal } = useCart();
  // No coupon has been entered yet at this point in the flow (coupon only
  // exists in checkout's own context, starting at Step 1) — teaser here is
  // always based on the raw cart subtotal.
  const freeShippingProgress = useFreeShippingProgress(subtotal, false, isCartOpen && items.length > 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[90] w-full max-w-md bg-navy-900 border-l border-blue-600/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <h2 className="font-display font-700 text-white text-lg">Your Order</h2>
                <p className="font-mono text-xs text-white/30 tracking-wider mt-0.5">
                  {itemCount} {itemCount === 1 ? "item" : "items"} · For research use only
                </p>
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display font-600 text-white/40 mb-1">Your order is empty</p>
                    <p className="font-body text-sm text-white/25">Browse the catalog to add compounds</p>
                  </div>
                  <Link
                    href="/#catalog"
                    onClick={closeCart}
                    className="mt-2 px-5 py-2.5 bg-blue-600/20 border border-blue-600/30 text-blue-300 font-display font-600 text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.slug}-${item.size}`} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-700 text-white text-sm">{item.name}</p>
                        <p className="font-mono text-xs text-blue-400/60 tracking-wider mt-0.5">{item.size}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.slug, item.size)}
                        className="text-white/20 hover:text-red-400 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.slug, item.size, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all flex items-center justify-center font-display font-600"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm text-white w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.slug, item.size, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all flex items-center justify-center font-display font-600"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display font-700 text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-white/8 space-y-4">
                <FreeShippingProgress data={freeShippingProgress} subtotal={subtotal} />
                <div className="flex items-center justify-between">
                  <span className="font-body text-white/50">Subtotal</span>
                  <span className="font-display font-700 text-white text-xl">${subtotal.toFixed(2)}</span>
                </div>
                <PaymentMethodsBar />
                <p className="font-mono text-[10px] text-white/20 tracking-wide leading-relaxed text-center">
                  Instructions sent after checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full text-center py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
                >
                  Proceed to Checkout →
                </Link>
                <button
                  onClick={closeCart}
                  className="block w-full text-center py-2 text-white/30 hover:text-white/60 font-body text-sm transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
