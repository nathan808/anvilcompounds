"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  orderId: number;
  status: string;
  paymentMethod: string;
  orderKey: string;
  lineItems: { name: string; quantity: number; total: string }[];
  billingAddress: string;
  trackingNumber: string | null;
  shipmentUpdates: { date: string; note: string }[];
}

// Shared between the authenticated account order view (AccountDashboard)
// and the guest order-lookup view (GuestOrderLookup) so both surfaces show
// the same thing: resume-payment for a still-unpaid order, tracking number
// once Ken's entered one, and the existing shipment-notes feed.
export default function OrderDetailBody({
  orderId,
  status,
  paymentMethod,
  orderKey,
  lineItems,
  billingAddress,
  trackingNumber,
  shipmentUpdates,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyTracking = () => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-1.5">
        {lineItems.map((li, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-sm">
            <span className="font-body text-white/60">{li.name} × {li.quantity}</span>
            <span className="font-mono text-white/50">${parseFloat(li.total).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {status === "on-hold" && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3.5 space-y-2.5">
          <p className="font-body text-sm text-amber-200">
            Payment not yet received. Nothing has been charged — this order is held pending payment.
          </p>
          <Link
            href={`/checkout/pay/${paymentMethod}?order=${orderId}&key=${orderKey}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-display font-600 text-sm transition-all duration-200"
          >
            Complete Payment →
          </Link>
        </div>
      )}

      {billingAddress && (
        <div>
          <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase mb-1">Shipping To</p>
          <p className="font-body text-sm text-white/60">{billingAddress}</p>
        </div>
      )}

      {trackingNumber && (
        <div>
          <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase mb-1">Tracking Number</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-white/80">{trackingNumber}</span>
            <button
              type="button"
              onClick={copyTracking}
              className="px-2 py-0.5 rounded bg-white/8 hover:bg-white/12 font-mono text-[10px] text-white/60"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase mb-2">Shipment Updates</p>
        {shipmentUpdates.length > 0 ? (
          <div className="space-y-2">
            {shipmentUpdates.map((u, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="font-mono text-[10px] text-blue-400/70 tracking-wide shrink-0 pt-0.5">
                  {new Date(u.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                <span className="font-body text-white/55">{u.note}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-white/30">
            No updates yet — you&apos;ll see fulfillment and shipping notes here once they&apos;re added to your order.
          </p>
        )}
      </div>
    </div>
  );
}
