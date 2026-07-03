"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getDiscountedPrice } from "@/lib/volumePricing";

export interface CartItem {
  slug: string;
  name: string;
  size: string;
  price: number;
  basePrice?: number;
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
    if (hydrated) {
      localStorage.setItem("anvil_cart", JSON.stringify(items));
      localStorage.setItem("anvil_cart_saved_at", Date.now().toString());
    }
  }, [items, hydrated]);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === item.slug && i.size === item.size);
      if (existing) {
        const newQty = existing.quantity + qty;
        const base = existing.basePrice ?? existing.price;
        return prev.map((i) =>
          i.slug === item.slug && i.size === item.size
            ? { ...i, quantity: newQty, price: getDiscountedPrice(base, newQty), basePrice: base }
            : i
        );
      }
      const base = item.basePrice ?? item.price;
      const discountedPrice = getDiscountedPrice(base, qty);
      return [...prev, { ...item, quantity: qty, price: discountedPrice, basePrice: base }];
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
    setItems((prev) =>
      prev.map((i) => {
        if (i.slug !== slug || i.size !== size) return i;
        const base = i.basePrice ?? i.price;
        return { ...i, quantity: qty, price: getDiscountedPrice(base, qty), basePrice: base };
      })
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
