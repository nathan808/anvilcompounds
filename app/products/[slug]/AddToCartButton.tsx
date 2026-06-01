"use client";

import { useState } from "react";
import { useCart } from "@/lib/cartContext";

interface Props {
  slug: string;
  name: string;
  sizes: string[];
  priceNumber: number;
  wcProductId: number;
}

export default function AddToCartButton({ slug, name, sizes, priceNumber, wcProductId }: Props) {
  const { addItem, openCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? "");
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ slug, name, size: selectedSize, price: priceNumber, wcProductId });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div>
          <p className="font-mono text-xs text-white/40 tracking-widest uppercase mb-3">Select Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-5 py-2.5 rounded-lg border font-mono text-sm font-500 transition-all duration-200 ${
                  selectedSize === size
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        className={`block w-full text-center py-4 font-display font-700 text-base rounded-xl transition-all duration-300 ${
          added
            ? "bg-green-600 text-white"
            : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
        }`}
      >
        {added ? "✓ Added to Order" : "Add to Cart"}
      </button>
      <p className="text-center font-mono text-[10px] text-white/20 tracking-wide">
        RUO only · Not for human or veterinary use · 21+ required
      </p>
    </div>
  );
}
