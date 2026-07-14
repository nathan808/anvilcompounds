"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentMethods from "./PaymentMethods";
import OrderSummary from "../OrderSummary";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { PAYMENT_METHODS } from "@/lib/paymentMethods";

export default function PaymentPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, hydrated: authHydrated, user } = useAuth();
  const { step1, coupon, shipping, paymentMethodId, hydrated: checkoutHydrated } = useCheckout();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);

  useEffect(() => {
    if (authHydrated && !isAuthenticated) {
      router.replace("/account?redirect=/checkout");
    }
  }, [authHydrated, isAuthenticated, router]);

  useEffect(() => {
    // Skip while an order submission is in flight — handleContinue clears the
    // cart right after creating the order and before navigating to the pay
    // page, which would otherwise make this effect see items.length === 0 and
    // race router.push with its own router.replace("/checkout").
    if (submitting) return;
    if (checkoutHydrated && (items.length === 0 || !step1.ruoConfirmed)) {
      router.replace("/checkout");
    } else if (checkoutHydrated && !shipping) {
      router.replace("/checkout/shipping");
    }
  }, [checkoutHydrated, items.length, step1.ruoConfirmed, shipping, router, submitting]);

  if (!authHydrated || !isAuthenticated || !checkoutHydrated) return null;

  const selectedMeta = PAYMENT_METHODS.find((m) => m.id === paymentMethodId) ?? null;
  const couponDiscount = computeCouponDiscount(subtotal, coupon);
  const postCouponSubtotal = subtotal - couponDiscount;
  const paymentDiscount = selectedMeta && selectedMeta.discountPercent > 0
    ? { label: `Payment method discount (${selectedMeta.label})`, amount: postCouponSubtotal * (selectedMeta.discountPercent / 100) }
    : null;

  const handleContinue = async () => {
    if (!paymentMethodId || !shipping) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Identifiers and selections ONLY — no price, total, discount, or tax
          // value is ever sent. The server derives all of those from WC itself.
          items: items.map((i) => ({ productId: i.wcProductId, size: i.size, quantity: i.quantity })),
          shippingInstanceId: shipping.instanceId,
          couponCode: coupon?.code,
          paymentMethodId,
          billing: step1,
          ruoConfirmed: step1.ruoConfirmed,
          customer_id: user?.wcCustomerId ?? 0,
          // Verification only — see PART C: if this disagrees with the
          // server's own computation, the order is not created.
          client_total_cents: previewTotal !== null ? Math.round(previewTotal * 100) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.error === "CART_CHANGED") {
          setError("Your cart has changed, please review.");
        } else {
          setError(data.message ?? data.error ?? "Something went wrong creating your order. Please try again or contact support@anvilcompounds.shop");
        }
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/checkout/pay/${paymentMethodId}?order=${data.orderId}&key=${data.orderKey}`);
    } catch {
      setError("Something went wrong. Please try again or contact support@anvilcompounds.shop");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-24">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        <div className="fixed top-0 left-0 right-0 z-[60] bg-navy-800/95 backdrop-blur-sm border-b border-blue-600/10">
          <p className="text-center font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase py-1.5">
            For laboratory and research use only · Must be 21+ to purchase
          </p>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Step 3 of 3 · Payment</span>
            </div>
            <h1 className="font-display font-800 text-white text-4xl">Choose Payment</h1>
            <p className="font-body text-white/40 mt-2">
              Checking out as <span className="text-white/60">{user?.email}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
            <div className="glass-card rounded-2xl p-8 space-y-6">
              <PaymentMethods />

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
                  {error}
                </div>
              )}

              <Link href="/checkout/shipping" className="inline-block font-mono text-xs text-white/40 hover:text-white/70 tracking-wide underline underline-offset-2">
                ← Back to Shipping
              </Link>

              <button
                type="button"
                disabled={!paymentMethodId || submitting}
                onClick={handleContinue}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-display font-700 text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30"
              >
                {submitting ? "Placing Order..." : "Continue to Payment →"}
              </button>
            </div>

            <div className="lg:sticky lg:top-28 space-y-4">
              <OrderSummary editableCoupon={false} showShipping paymentDiscount={paymentDiscount} onTotalChange={setPreviewTotal} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
