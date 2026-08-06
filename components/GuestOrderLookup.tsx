"use client";

import { useState, FormEvent } from "react";
import type { GuestOrderDetail } from "@/app/api/orders/lookup/route";
import OrderDetailBody from "@/components/OrderDetailBody";

const STATUS_STYLES: Record<string, string> = {
  "on-hold":   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  pending:     "bg-amber-500/15 text-amber-400 border-amber-500/25",
  processing:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
  completed:   "bg-green-500/15 text-green-400 border-green-500/25",
  cancelled:   "bg-red-500/15 text-red-400 border-red-500/25",
  refunded:    "bg-red-500/15 text-red-400 border-red-500/25",
  failed:      "bg-red-500/15 text-red-400 border-red-500/25",
};

const STATUS_LABELS: Record<string, string> = {
  "on-hold": "Pending Payment",
  pending: "Pending Payment",
  processing: "Processing",
  completed: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function GuestOrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<GuestOrderDetail | null>(null);

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setOrder(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (order) {
    return (
      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display font-700 text-white text-lg">Order #{order.number}</p>
            <p className="font-mono text-xs text-white/30 mt-1">{formatDate(order.dateCreated)}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-600 uppercase border shrink-0 ${STATUS_STYLES[order.status] ?? "bg-white/10 text-white/50 border-white/15"}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        <div className="border-t border-white/8">
          <OrderDetailBody
            orderId={order.id}
            status={order.status}
            paymentMethod={order.paymentMethod}
            orderKey={order.orderKey}
            lineItems={order.lineItems}
            billingAddress={order.billingAddress}
            trackingNumber={order.trackingNumber}
            shipmentUpdates={order.shipmentUpdates}
          />
          <div className="flex items-center justify-between pt-2 border-t border-white/8 mt-4">
            <span className="font-body text-sm text-white/50">Total</span>
            <span className="font-display font-700 text-white">${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setOrder(null); setOrderNumber(""); setEmail(""); }}
          className="w-full py-3 border border-white/15 hover:border-blue-400/40 text-white/60 hover:text-blue-300 font-display font-600 text-sm rounded-xl transition-all duration-300"
        >
          Look up another order
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
      <p className="font-body text-sm text-white/50">
        No account needed — enter your order number and the email you checked out with.
      </p>
      <div>
        <label className={labelClass}>Order Number *</label>
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="e.g. 1042"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Email *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@institution.edu"
          className={inputClass}
        />
      </div>
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300"
      >
        {loading ? "Looking up..." : "Find My Order →"}
      </button>
    </form>
  );
}
