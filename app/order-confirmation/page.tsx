"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface OrderData {
  orderId: number;
  orderNumber: string;
  email: string;
  items: Array<{ name: string; size: string; price: number; quantity: number }>;
  subtotal: number;
}

const PAYMENT_METHODS = [
  {
    label: "ACH Transfer",
    desc: "Lowest fees. Via LinkMoney or Plaid. Instructions sent via email.",
    icon: "🏦",
    color: "border-blue-600/20 bg-blue-600/5",
  },
  {
    label: "USDC / USDT",
    desc: "Crypto stablecoin. Via NOWPayments. Wallet address in your email.",
    icon: "₿",
    color: "border-indigo-600/20 bg-indigo-600/5",
  },
  {
    label: "Zelle",
    desc: "Send to our business account. Details in your confirmation email.",
    icon: "⚡",
    color: "border-cyan-600/20 bg-cyan-600/5",
  },
  {
    label: "CashApp",
    desc: "Send to our $cashtag. Details in your confirmation email.",
    icon: "💚",
    color: "border-teal-600/20 bg-teal-600/5",
  },
];

const STEPS = [
  { label: "Payment Sent", sub: "You initiate payment" },
  { label: "Payment Confirmed", sub: "Typically 1–4 hours" },
  { label: "Order Ships", sub: "Same or next business day" },
];

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("anvil_order");
      if (stored) setOrder(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-28">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-6">

          {/* Confirmation header */}
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display font-800 text-white text-3xl mb-2">Order Reserved</h1>
            {order && (
              <p className="font-mono text-sm text-blue-400 tracking-wider mb-3">
                Order #{order.orderNumber ?? order.orderId}
              </p>
            )}
            <p className="font-body text-white/45 leading-relaxed max-w-md mx-auto">
              Your order is reserved for 48 hours. Complete payment using any method below to confirm shipment.
            </p>
          </div>

          {/* Payment instructions */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Next Step</span>
            </div>
            <h2 className="font-display font-700 text-white text-xl mb-2">Complete Your Payment</h2>
            <p className="font-body text-white/45 text-sm leading-relaxed mb-6">
              Send payment via any method below. Include your order number{" "}
              <span className="font-mono text-blue-400">
                #{order?.orderNumber ?? order?.orderId ?? "—"}
              </span>{" "}
              in the payment memo or note.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map((m) => (
                <div key={m.label} className={`rounded-xl border p-4 ${m.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{m.icon}</span>
                    <span className="font-display font-700 text-white text-sm">{m.label}</span>
                  </div>
                  <p className="font-body text-xs text-white/40 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-blue-600/8 border border-blue-600/15 px-5 py-4">
              <p className="font-mono text-xs text-blue-400/80 tracking-wide">
                ⚠ Orders not paid within 48 hours are automatically released and inventory is returned to stock.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-display font-700 text-white mb-6">What Happens Next</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex sm:flex-col items-center gap-3 sm:gap-2 flex-1">
                  <div className="flex sm:flex-col items-center gap-3 sm:gap-2 w-full">
                    <div className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:w-full">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
                        <span className="font-mono text-xs text-blue-400">{i + 1}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="hidden sm:block flex-1 h-px bg-blue-600/20 mx-2" />
                      )}
                    </div>
                  </div>
                  <div className="sm:text-center">
                    <p className="font-display font-700 text-white text-sm">{step.label}</p>
                    <p className="font-mono text-[10px] text-white/30 tracking-wide mt-0.5">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email notice */}
          {order?.email && (
            <div className="glass-card rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-display font-700 text-white text-sm mb-1">Confirmation email sent</p>
                <p className="font-body text-sm text-white/40">
                  Full payment instructions sent to <span className="text-white/60">{order.email}</span>. Tracking will be added once your order ships.
                </p>
              </div>
            </div>
          )}

          {/* Order summary */}
          {order && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-700 text-white mb-4 text-sm">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-body text-sm text-white/50">{item.name} · {item.size} · ×{item.quantity}</span>
                    <span className="font-mono text-sm text-white/50">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/8 pt-3 flex items-center justify-between">
                <span className="font-body text-white/50 text-sm">Subtotal</span>
                <span className="font-display font-700 text-white">${order.subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Back to catalog */}
          <div className="text-center pb-8">
            <Link
              href="/#catalog"
              className="inline-flex items-center gap-2 font-body text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Catalog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
