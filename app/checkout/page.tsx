"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutForm from "./CheckoutForm";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";

const PAYMENT_METHODS = [
  { label: "ACH Transfer", sub: "Via LinkMoney or Plaid", icon: "🏦" },
  { label: "USDC / USDT", sub: "Via NOWPayments", icon: "₿" },
  { label: "Zelle", sub: "To our business account", icon: "⚡" },
  { label: "CashApp", sub: "To our $cashtag", icon: "💚" },
];

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const { isAuthenticated, hydrated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/account?redirect=/checkout");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-24">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        {/* RUO bar */}
        <div className="fixed top-0 left-0 right-0 z-[60] bg-navy-800/95 backdrop-blur-sm border-b border-blue-600/10">
          <p className="text-center font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase py-1.5">
            For laboratory and research use only · Must be 21+ to purchase
          </p>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Checkout</span>
            </div>
            <h1 className="font-display font-800 text-white text-4xl">Reserve Your Order</h1>
            <p className="font-body text-white/40 mt-2">
              Checking out as <span className="text-white/60">{user?.email}</span> ·{" "}
              <button onClick={() => { router.push("/account"); }} className="text-blue-400/70 hover:text-blue-400 transition-colors text-sm underline underline-offset-2">
                Not you?
              </button>
            </p>
          </div>

          {items.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <p className="font-display font-700 text-white/40 text-xl mb-2">Your cart is empty</p>
              <p className="font-body text-white/25 mb-6">Add compounds from the catalog before checking out.</p>
              <Link href="/#catalog" className="px-6 py-3 bg-blue-600 text-white font-display font-600 rounded-xl hover:bg-blue-500 transition-all">
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
              {/* Left — form */}
              <div className="glass-card rounded-2xl p-8">
                <CheckoutForm />
              </div>

              {/* Right — order summary (sticky) */}
              <div className="lg:sticky lg:top-28 space-y-4">
                {/* Order summary */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display font-700 text-white mb-4">Order Summary</h3>
                  <div className="space-y-3 mb-5">
                    {items.map((item) => (
                      <div key={`${item.slug}-${item.size}`} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-white/70">{item.name}</p>
                          <p className="font-mono text-xs text-blue-400/50 tracking-wider">{item.size} · qty {item.quantity}</p>
                        </div>
                        <span className="font-mono text-sm text-white/70 shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/8 pt-4 flex items-center justify-between">
                    <span className="font-body text-white/50">Subtotal</span>
                    <span className="font-display font-800 text-white text-xl">${subtotal.toFixed(2)}</span>
                  </div>
                  <p className="font-mono text-[10px] text-white/20 tracking-wide mt-3">
                    Shipping calculated at confirmation. US domestic only.
                  </p>
                </div>

                {/* Payment info */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <h3 className="font-display font-700 text-white text-sm">Payment</h3>
                  </div>
                  <p className="font-body text-xs text-white/40 leading-relaxed mb-4">
                    No card processing. After reserving, you'll receive payment instructions via email. Orders ship once payment clears.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <div key={m.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/6">
                        <span className="text-base">{m.icon}</span>
                        <div>
                          <p className="font-mono text-xs text-white/60">{m.label}</p>
                          <p className="font-mono text-[9px] text-white/25">{m.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-white/20 tracking-wide mt-3">
                    Orders held 48 hours pending payment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
