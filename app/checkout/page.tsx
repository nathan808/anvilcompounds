"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Step1Form, { getMissingFields } from "./Step1Form";
import ShippingMethods from "./ShippingMethods";
import PaymentMethods from "./PaymentMethods";
import OrderSummary from "./OrderSummary";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import { useCheckout } from "@/lib/checkoutContext";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeVolumeDiscount } from "@/lib/volumeDiscount";
import { computeBogoDiscount } from "@/lib/bogoDiscount";
import { PAYMENT_METHODS } from "@/lib/paymentMethods";
import { trackMetaEvent } from "@/lib/metaPixel";

// One-page checkout: contact/address, shipping method, and payment method
// all on this page, one Place Order button. Replaces the old 3-step flow
// (/checkout → /checkout/shipping → /checkout/payment, which now redirect
// here). Pricing is still never sent to the server — place-order derives
// every amount from WC and rejects a mismatched client_total_cents.

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="glass-card rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 font-mono text-xs flex items-center justify-center shrink-0">
          {n}
        </span>
        <h2 className="font-display font-700 text-white text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, openCart } = useCart();
  const { isAuthenticated, hydrated: authHydrated, user } = useAuth();
  const { step1, coupon, shipping, paymentMethodId, hydrated: checkoutHydrated, clearCheckout } = useCheckout();
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const initiateCheckoutFiredRef = useRef(false);

  useEffect(() => {
    if (initiateCheckoutFiredRef.current || items.length === 0) return;
    initiateCheckoutFiredRef.current = true;
    trackMetaEvent("InitiateCheckout", {
      content_ids: items.map((i) => String(i.wcProductId)),
      content_type: "product",
      num_items: items.reduce((s, i) => s + i.quantity, 0),
      value: subtotal,
      currency: "USD",
    });
  }, [items, subtotal]);

  if (!authHydrated || !checkoutHydrated) return null;

  // Payment-method % discount (suppressed under BOGO) — same compounding
  // base as place-order/route.ts, passed to OrderSummary for the total.
  const selectedMeta = PAYMENT_METHODS.find((m) => m.id === paymentMethodId) ?? null;
  const bogoDiscount = computeBogoDiscount(items.map((i) => ({ quantity: i.quantity, unitPrice: i.price, regularPrice: i.regularPrice, productId: i.wcProductId })));
  const bogoActive = bogoDiscount > 0;
  const couponDiscount = computeCouponDiscount(subtotal - bogoDiscount, coupon);
  const volumeDiscount = bogoActive ? 0 : computeVolumeDiscount(subtotal, !!coupon);
  const discountedSubtotal = subtotal - couponDiscount - volumeDiscount - bogoDiscount;
  const paymentDiscount = !bogoActive && selectedMeta && selectedMeta.discountPercent > 0
    ? { label: `Payment method discount (${selectedMeta.label})`, amount: discountedSubtotal * (selectedMeta.discountPercent / 100) }
    : null;

  const missing = getMissingFields(step1);
  if (!shipping) missing.push("a shipping method");
  if (!paymentMethodId) missing.push("a payment method");

  const handlePlaceOrder = async () => {
    if (missing.length > 0) {
      setShowErrors(true);
      return;
    }
    if (!shipping || !paymentMethodId) return;
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
          // Verification only: if this disagrees with the server's own
          // computation, the order is not created (CART_CHANGED).
          client_total_cents: previewTotal !== null ? Math.round(previewTotal * 100) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error === "CART_CHANGED"
          ? "Your cart has changed, please review."
          : data.message ?? data.error ?? "Something went wrong creating your order. Please try again or contact support@anvilcompounds.shop");
        setSubmitting(false);
        return;
      }
      // Navigate first, then clear — clearing first would flash the
      // empty-cart state below while the pay page loads.
      router.push(`/checkout/pay/${paymentMethodId}?order=${data.orderId}&key=${data.orderKey}`);
      clearCart();
      clearCheckout();
    } catch {
      setError("Something went wrong. Please try again or contact support@anvilcompounds.shop");
      setSubmitting(false);
    }
  };

  const backLinkClass = "inline-flex items-center gap-1.5 font-mono text-xs text-white/45 hover:text-white/80 tracking-wide transition-colors";

  return (
    <>
      <Navbar pushDown />
      <main className="bg-navy-950 min-h-screen pt-24">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        {/* RUO bar */}
        <div className="fixed top-0 left-0 right-0 z-[60] h-7 flex items-center justify-center bg-navy-800/95 backdrop-blur-sm border-b border-blue-600/10">
          <p className="text-center font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase">
            For laboratory and research use only · Must be 21+ to purchase
          </p>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-10">
          {/* Back navigation */}
          <div className="flex items-center gap-5 mb-4">
            <button type="button" onClick={openCart} className={backLinkClass}>
              ← Back to cart
            </button>
            <span className="w-px h-3 bg-white/15" />
            <Link href="/catalog" className={backLinkClass}>
              Continue shopping
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display font-800 text-white text-3xl sm:text-4xl">Checkout</h1>
            <p className="font-body text-white/40 mt-2">
              {isAuthenticated ? (
                <>
                  Checking out as <span className="text-white/60">{user?.email}</span> ·{" "}
                  <button onClick={() => router.push("/account")} className="text-blue-400/70 hover:text-blue-400 transition-colors text-sm underline underline-offset-2">
                    Not you?
                  </button>
                </>
              ) : (
                <>
                  Checking out as a guest ·{" "}
                  <button onClick={() => router.push("/account?redirect=/checkout")} className="text-blue-400/70 hover:text-blue-400 transition-colors text-sm underline underline-offset-2">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <p className="font-display font-700 text-white/40 text-xl mb-2">Your cart is empty</p>
              <p className="font-body text-white/25 mb-6">Add compounds from the catalog before checking out.</p>
              <Link href="/catalog" className="px-6 py-3 bg-blue-600 text-white font-display font-600 rounded-xl hover:bg-blue-500 transition-all">
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
              <div className="space-y-6">
                <Section n={1} title="Contact & Delivery">
                  <Step1Form />
                </Section>

                <Section n={2} title="Shipping Method">
                  <ShippingMethods />
                </Section>

                <Section n={3} title="Payment">
                  <PaymentMethods />
                </Section>

                <div className="space-y-4">
                  {showErrors && missing.length > 0 && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
                      Please complete: {missing.join(", ")}.
                    </div>
                  )}
                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
                      {error}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={submitting || previewTotal === null}
                    onClick={handlePlaceOrder}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-display font-700 text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30"
                  >
                    {submitting
                      ? "Placing Order…"
                      : previewTotal === null
                      ? "Calculating total…"
                      : shipping
                      ? `Place Order · $${previewTotal.toFixed(2)}`
                      : "Place Order"}
                  </button>
                  <p className="font-body text-xs text-white/30 text-center">
                    You&apos;ll be taken to a secure page to complete payment. Nothing is charged until then.
                  </p>
                </div>
              </div>

              <div className="lg:sticky lg:top-28 space-y-4">
                <OrderSummary showShipping paymentDiscount={paymentDiscount} onTotalChange={setPreviewTotal} />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
