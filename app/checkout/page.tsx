"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Step1Form from "./Step1Form";
import OrderSummary from "./OrderSummary";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";

export default function CheckoutPage() {
  const { items } = useCart();
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
      <Navbar pushDown />
      <main className="bg-navy-950 min-h-screen pt-32">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        {/* RUO bar */}
        <div className="fixed top-0 left-0 right-0 z-[60] h-7 flex items-center justify-center bg-navy-800/95 backdrop-blur-sm border-b border-blue-600/10">
          <p className="text-center font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase">
            For laboratory and research use only · Must be 21+ to purchase
          </p>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Step 1 of 3 · Information</span>
            </div>
            <h1 className="font-display font-800 text-white text-4xl">Checkout</h1>
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
              <Link href="/catalog" className="px-6 py-3 bg-blue-600 text-white font-display font-600 rounded-xl hover:bg-blue-500 transition-all">
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
              <div className="glass-card rounded-2xl p-8">
                <Step1Form />
              </div>
              <div className="lg:sticky lg:top-28 space-y-4">
                <OrderSummary showFreeShippingProgress />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
