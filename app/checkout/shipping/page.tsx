"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShippingMethods from "./ShippingMethods";
import OrderSummary from "../OrderSummary";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import { useCheckout } from "@/lib/checkoutContext";

export default function ShippingPage() {
  const { items } = useCart();
  const { isAuthenticated, hydrated: authHydrated, user } = useAuth();
  const { step1, shipping, hydrated: checkoutHydrated } = useCheckout();
  const router = useRouter();

  useEffect(() => {
    if (authHydrated && !isAuthenticated) {
      router.replace("/account?redirect=/checkout");
    }
  }, [authHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (checkoutHydrated && (items.length === 0 || !step1.ruoConfirmed)) {
      router.replace("/checkout");
    }
  }, [checkoutHydrated, items.length, step1.ruoConfirmed, router]);

  if (!authHydrated || !isAuthenticated || !checkoutHydrated) return null;

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
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Step 2 of 3 · Shipping</span>
            </div>
            <h1 className="font-display font-800 text-white text-4xl">Choose Shipping</h1>
            <p className="font-body text-white/40 mt-2">
              Checking out as <span className="text-white/60">{user?.email}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
            <div className="glass-card rounded-2xl p-8 space-y-6">
              <ShippingMethods />

              <Link href="/checkout" className="inline-block font-mono text-xs text-white/40 hover:text-white/70 tracking-wide underline underline-offset-2">
                ← Back to Information
              </Link>

              <button
                type="button"
                disabled={!shipping}
                onClick={() => router.push("/checkout/payment")}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-display font-700 text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Continue to Payment →
              </button>
            </div>

            <div className="lg:sticky lg:top-28 space-y-4">
              <OrderSummary editableCoupon={false} showShipping />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
