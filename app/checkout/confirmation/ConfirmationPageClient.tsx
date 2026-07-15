"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentInstructions from "@/components/PaymentInstructions";
import { PaymentMethodId } from "@/lib/paymentMethods";

const KNOWN_METHODS: PaymentMethodId[] = ["ethereum", "echeck", "zelle", "usdc_usdt", "ach", "stripe"];

interface OrderStatus {
  orderNumber: string;
  status: string;
  total: string;
  holdExpiryDate: string;
  paymentMethod: string;
}

function formatMoney(total: string): string {
  const n = parseFloat(total);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : total;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function ConfirmationPageClient() {
  const searchParams = useSearchParams();
  // Bankful's x_url_complete carries only ?order=<id> — no key. This page
  // never trusts any status the URL might also carry; it always re-fetches
  // the order's real status from WooCommerce below.
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Missing order reference.");
      return;
    }
    fetch(`/api/checkout/order-status?order=${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error) {
          setError("We couldn't find this order. Please contact support@anvilcompounds.shop.");
          return;
        }
        setOrder(data);
      })
      .catch(() => setError("We couldn't find this order. Please contact support@anvilcompounds.shop."));
  }, [orderId]);

  return (
    <>
      <Navbar pushDown />
      <main className="bg-navy-950 min-h-screen pt-32">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        <div className="fixed top-0 left-0 right-0 z-[60] h-7 flex items-center justify-center bg-navy-800/95 backdrop-blur-sm border-b border-blue-600/10">
          <p className="text-center font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase">
            For laboratory and research use only · Must be 21+ to purchase
          </p>
        </div>

        <div className="relative z-10 max-w-xl mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Order Status</span>
            </div>
            <h1 className="font-display font-800 text-white text-3xl">Your Order</h1>
          </div>

          {error ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="font-body text-red-400">{error}</p>
            </div>
          ) : !order ? (
            <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ) : order.status === "processing" || order.status === "completed" ? (
            <div className="glass-card rounded-2xl p-8 text-center space-y-3">
              <p className="font-display font-800 text-white text-xl">Payment Received</p>
              <p className="font-body text-white/50">
                Order <span className="text-white/80 font-mono">#{order.orderNumber}</span> — {formatMoney(order.total)}
              </p>
              <p className="font-body text-sm text-white/40">
                Your order is confirmed and will ship soon. A confirmation has been sent to your email.
              </p>
            </div>
          ) : order.status === "cancelled" ? (
            <div className="glass-card rounded-2xl p-8 text-center space-y-3">
              <p className="font-display font-800 text-white text-xl">Order Expired</p>
              <p className="font-body text-sm text-white/40">
                Order <span className="text-white/70 font-mono">#{order.orderNumber}</span> was cancelled or expired before payment was received. Contact support@anvilcompounds.shop if you believe this is an error.
              </p>
            </div>
          ) : order.status === "on-hold" && KNOWN_METHODS.includes(order.paymentMethod as PaymentMethodId) ? (
            <PaymentInstructions
              methodId={order.paymentMethod as PaymentMethodId}
              context={{
                orderNumber: order.orderNumber,
                total: formatMoney(order.total),
                holdExpiryDate: formatDate(order.holdExpiryDate),
              }}
            />
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center space-y-3">
              <p className="font-display font-700 text-white">
                Order <span className="font-mono text-blue-400">#{order.orderNumber}</span> is {order.status}.
              </p>
              <p className="font-body text-sm text-white/40">
                Contact support@anvilcompounds.shop with any questions about this order.
              </p>
            </div>
          )}

          <p className="text-center font-mono text-[9px] text-white/20 tracking-wide mt-8">
            For laboratory and research use only. Not for human or veterinary consumption. Must be 21+ to purchase.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
