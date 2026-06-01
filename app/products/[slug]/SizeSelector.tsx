"use client";

import { useState } from "react";

export default function SizeSelector({ sizes }: { sizes: string[] }) {
  const [selected, setSelected] = useState(sizes[0] ?? "");

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => setSelected(size)}
          className={`px-5 py-2.5 rounded-xl font-mono text-sm tracking-wide transition-all duration-200 border ${
            selected === size
              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
              : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/75"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
