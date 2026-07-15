"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentInstructions from "@/components/PaymentInstructions";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";
import { PaymentMethodId } from "@/lib/paymentMethods";

const VALID_METHODS: PaymentMethodId[] = ["ethereum", "echeck", "zelle", "usdc_usdt", "ach", "stripe"];
const BANKFUL_METHODS: PaymentMethodId[] = ["ethereum", "echeck"];

interface OrderStatus {
  orderId: number;
  orderNumber: string;
  status: string;
  total: string;
  holdExpiryDate: string;
}

function formatMoney(total: string): string {
  const n = parseFloat(total);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : total;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function PayPageClient({ method }: { method: string }) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const orderKey = searchParams.get("key");
  const cancelled = searchParams.get("cancelled") === "1";

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isValidMethod = VALID_METHODS.includes(method as PaymentMethodId);
  const isBankfulMethod = BANKFUL_METHODS.includes(method as PaymentMethodId);

  useEffect(() => {
    if (!isValidMethod || !orderId || !orderKey) {
      setLoadError("This payment link is invalid or incomplete.");
      return;
    }
    fetch(`/api/checkout/order-status?order=${encodeURIComponent(orderId)}&key=${encodeURIComponent(orderKey)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error) {
          setLoadError("We couldn't find this order. Please contact support@anvilcompounds.shop.");
          return;
        }
        setOrder(data);
      })
      .catch(() => setLoadError("We couldn't find this order. Please contact support@anvilcompounds.shop."));
  }, [isValidMethod, orderId, orderKey]);

  const handleBankfulContinue = async () => {
    if (!orderId || !orderKey) return;
    setSubmitting(true);
    setLinkError("");
    try {
      const res = await fetch("/api/checkout/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(orderId), orderKey, method }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setLinkError(data.error ?? "Could not start payment. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setLinkError("Could not start payment. Please try again.");
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

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
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Complete Your Payment</span>
            </div>
            <h1 className="font-display font-800 text-white text-3xl">Complete Your Payment</h1>
          </div>

          {!isValidMethod ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="font-body text-white/50">Unknown payment method.</p>
            </div>
          ) : loadError ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="font-body text-red-400">{loadError}</p>
            </div>
          ) : !order ? (
            <div className="space-y-4">
              <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-6">
              {cancelled && (
                <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-body text-sm">
                  Payment was cancelled. You can try again below.
                </div>
              )}

              {order.status !== "on-hold" ? (
                <div className="glass-card rounded-2xl p-8 text-center space-y-3">
                  <p className="font-display font-700 text-white">
                    This order is already <span className="text-blue-400">{order.status}</span>.
                  </p>
                  <p className="font-body text-sm text-white/40">
                    No further payment action is needed. Contact support@anvilcompounds.shop with any questions.
                  </p>
                </div>
              ) : (
                <>
                  <PaymentInstructions
                    methodId={method as PaymentMethodId}
                    context={{
                      orderNumber: order.orderNumber,
                      total: formatMoney(order.total),
                      holdExpiryDate: formatDate(order.holdExpiryDate),
                    }}
                  />

                  {isBankfulMethod && (
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                      {linkError && (
                        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
                          {linkError}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleBankfulContinue}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-display font-700 text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30"
                      >
                        {submitting ? "Redirecting..." : "Continue to Secure Payment →"}
                      </button>
                    </div>
                  )}

                  {method === "zelle" && (
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                      <div className="px-4 py-3 rounded-xl bg-blue-600/10 border border-blue-500/30">
                        <p className="font-body text-sm text-white/80 font-600">
                          In the Zelle memo, enter ONLY your order number: <span className="font-mono text-blue-300">#{order.orderNumber}</span>. Do not describe the items.
                        </p>
                      </div>

                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <p className="font-mono text-xs text-white/40 uppercase tracking-wide">Zelle Phone</p>
                          <p className="font-mono text-white">{PAYMENT_CONFIG.zelle.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(PAYMENT_CONFIG.zelle.phone, "phone")}
                          className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 font-mono text-xs text-white/70"
                        >
                          {copiedField === "phone" ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <p className="font-mono text-xs text-white/40 uppercase tracking-wide">Order Number</p>
                          <p className="font-mono text-white">#{order.orderNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.orderNumber, "orderNumber")}
                          className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 font-mono text-xs text-white/70"
                        >
                          {copiedField === "orderNumber" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}

                  {(method === "usdc_usdt" || method === "ach" || method === "stripe") && (
                    <div className="glass-card rounded-2xl p-6">
                      {/* TODO: wire this button to the real integration boundary —
                          NOWPayments (usdc_usdt), LinkMoney (ach), Stripe (stripe).
                          Intentionally stubbed: no payment action happens here yet. */}
                      <button
                        type="button"
                        disabled
                        className="w-full py-4 bg-white/8 text-white/30 font-display font-700 text-base rounded-xl cursor-not-allowed"
                      >
                        Not Yet Available
                      </button>
                    </div>
                  )}
                </>
              )}
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
