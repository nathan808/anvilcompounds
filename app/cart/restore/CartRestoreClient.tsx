"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cartContext";

export interface RestoreItem {
  slug: string;
  name: string;
  size: string;
  basePrice: number;
  wcProductId: number;
  quantity: number;
}

export default function CartRestoreClient({ items }: { items: RestoreItem[] }) {
  const { clearCart, addItem } = useCart();
  const [done, setDone] = useState(false);
  // Cart writes to localStorage on every change, so a React-strict-mode
  // double-invoke or a back/forward nav re-mount must not re-run this and
  // add everything twice — restoring is a one-shot action per page load.
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    // Replaces whatever's already in the cart rather than merging into it —
    // this link represents the customer's whole order, not an addition to
    // one, and their cart may still hold the abandoned items from the
    // failed-payment attempt this link is meant to supersede.
    clearCart();
    for (const item of items) {
      addItem(
        { slug: item.slug, name: item.name, size: item.size, price: item.basePrice, basePrice: item.basePrice, wcProductId: item.wcProductId },
        item.quantity
      );
    }
    setDone(true);
    // clearCart/addItem are stable across renders (setState setters from
    // context); omitting them keeps this a true one-shot on `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <>
      <Navbar pushDown />
      <main className="bg-navy-950 min-h-screen pt-32 pb-24">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
        <div className="relative max-w-lg mx-auto px-6 text-center">
          {items.length === 0 ? (
            <>
              <h1 className="font-display text-2xl text-white mb-3">We couldn&apos;t rebuild this order</h1>
              <p className="font-body text-white/60 mb-8">
                This link may be out of date. Contact support@anvilcompounds.shop and we&apos;ll help you sort it out.
              </p>
              <Link href="/all-compounds" className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-body font-medium hover:bg-blue-500 transition-colors">
                Browse Compounds
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl text-white mb-3">
                {done ? "Your order is back in your cart" : "Restoring your order…"}
              </h1>
              <ul className="text-left font-body text-white/70 text-sm mb-8 space-y-2 bg-navy-800/60 border border-white/10 rounded-xl p-5">
                {items.map((item) => (
                  <li key={item.slug} className="flex justify-between gap-4">
                    <span>{item.name}</span>
                    <span className="text-white/40">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/checkout"
                className="inline-block px-8 py-3.5 rounded-lg bg-blue-600 text-white font-body font-medium hover:bg-blue-500 transition-colors"
              >
                Continue to Checkout
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
