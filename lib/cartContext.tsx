"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { MAX_QTY_PER_ITEM } from "@/lib/volumePricing";
import { trackMetaEvent } from "@/lib/metaPixel";

export interface CartItem {
  slug: string;
  name: string;
  size: string;
  price: number; // WC's active/Single price — constant regardless of quantity (no more volume-tier scaling)
  regularPrice?: number; // WC's regular_price ("Base") — the B1G1 pair must total exactly this (lib/bogoDiscount.ts)
  wcProductId: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (slug: string, size: string) => void;
  updateQty: (slug: string, size: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const savedAt = localStorage.getItem("anvil_cart_saved_at");
      const isExpired = savedAt && Date.now() - parseInt(savedAt) > THIRTY_DAYS_MS;
      if (isExpired) {
        localStorage.removeItem("anvil_cart");
        localStorage.removeItem("anvil_cart_saved_at");
      } else {
        const stored = localStorage.getItem("anvil_cart");
        if (stored) setItems(JSON.parse(stored));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Guarded for the same reason as elsewhere in this app: localStorage
    // writes can throw on some browsers (Safari Private Browsing, some
    // in-app browsers), and this runs on every cart change. Without the
    // guard, add-to-cart/qty changes would keep throwing on those browsers
    // even though the in-memory cart state (and checkout) still work fine.
    if (hydrated) {
      try {
        localStorage.setItem("anvil_cart", JSON.stringify(items));
        localStorage.setItem("anvil_cart_saved_at", Date.now().toString());
      } catch {}
    }
  }, [items, hydrated]);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === item.slug && i.size === item.size);
      if (existing) {
        const newQty = Math.min(MAX_QTY_PER_ITEM, existing.quantity + qty);
        return prev.map((i) =>
          i.slug === item.slug && i.size === item.size ? { ...i, quantity: newQty } : i
        );
      }
      const cappedQty = Math.min(MAX_QTY_PER_ITEM, qty);
      return [...prev, { ...item, quantity: cappedQty }];
    });

    trackMetaEvent("AddToCart", {
      content_ids: [String(item.wcProductId)],
      content_type: "product",
      content_name: item.name,
      value: item.price * qty,
      currency: "USD",
    });

    // Fire-and-forget Omnisend "Added to Cart" event — never blocks cart
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "Added to Cart",
        payload: {
          productName: item.name,
          productId: String(item.wcProductId),
          sku: item.slug,
          size: item.size,
          price: item.price,
          currency: "USD",
        },
      }),
    }).catch(() => {});
  };

  const removeItem = (slug: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.slug === slug && i.size === size)));
  };

  const updateQty = (slug: string, size: string, qty: number) => {
    if (qty <= 0) { removeItem(slug, size); return; }
    // BOGO-eligible items default to 2 on first add (AddToCartButton/
    // ProductsSection), but once in the cart the customer can freely edit
    // back down to 1 — no floor enforced here. Per-unit price no longer
    // changes with quantity (volume-discount tiers removed) — the BOGO
    // pair discount is computed separately as a checkout-level fee line.
    const cappedQty = Math.min(MAX_QTY_PER_ITEM, qty);
    setItems((prev) =>
      prev.map((i) => (i.slug === slug && i.size === size ? { ...i, quantity: cappedQty } : i))
    );
  };

  const clearCart = () => setItems([]);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      itemCount, subtotal,
      isCartOpen, openCart: () => setIsCartOpen(true), closeCart: () => setIsCartOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
