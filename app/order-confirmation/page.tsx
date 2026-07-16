"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PAYMENT_DETAILS, PAYMENT_CONFIG, HOLD_DAYS, SUPPORT_EMAIL } from "@/lib/paymentConfig";
import type { OrderDetail } from "@/app/api/orders/[id]/route";

// ─── Discount badge ────────────────────────────────────────────────────────────

function DiscountBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-600 bg-amber-500/15 text-amber-400 border border-amber-500/25">
      ✦ {text}
    </span>
  );
}

// ─── Payment block ─────────────────────────────────────────────────────────────

function PaymentBlock({
  icon,
  title,
  discount,
  children,
  orderNumber,
  timeline,
}: {
  icon: string;
  title: string;
  discount?: string;
  children: React.ReactNode;
  orderNumber: string;
  timeline: string;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-600/40 to-transparent" />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-display font-700 text-white text-lg">{title}</h3>
          </div>
          {discount && <DiscountBadge text={discount} />}
        </div>

        {/* Account details */}
        <div className="space-y-2 mb-4">{children}</div>

        {/* Order note */}
        <div className="rounded-xl bg-blue-600/8 border border-blue-600/15 px-4 py-3 mb-3">
          <p className="font-mono text-xs text-blue-400 tracking-wide">
            Note in payment memo:{" "}
            <span className="text-white font-600">Order #{orderNumber}</span>
          </p>
        </div>

        {/* Timeline */}
        <p className="font-mono text-[10px] text-white/30 tracking-wide">{timeline}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
      <span className="font-mono text-[10px] text-white/35 tracking-widest uppercase shrink-0">
        {label}
      </span>
      <span className="font-body text-sm text-white/70 text-right break-all">{value}</span>
    </div>
  );
}

// ─── Main content ──────────────────────────────────────────────────────────────

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) { setLoading(false); setError(true); return; }

    fetch(`/api/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<OrderDetail>;
      })
      .then((data) => { setOrder(data); setLoading(false); })
      .catch(() => {
        // Fallback: try sessionStorage
        try {
          const stored = sessionStorage.getItem("anvil_order");
          if (stored) {
            const s = JSON.parse(stored) as {
              orderId: number; orderNumber: string; email: string;
              items: { name: string; size: string; price: number; quantity: number }[];
              subtotal: number;
            };
            setOrder({
              id: s.orderId,
              number: s.orderNumber,
              status: "on-hold",
              total: s.subtotal.toFixed(2),
              currency: "USD",
              email: s.email,
              firstName: "",
              lastName: "",
              lineItems: s.items.map((i) => ({
                name: `${i.name} — ${i.size}`,
                quantity: i.quantity,
                total: (i.price * i.quantity).toFixed(2),
              })),
            });
          } else {
            setError(true);
          }
        } catch { setError(true); }
        setLoading(false);
      });
  }, [orderId]);

  const orderNum = order?.number ?? orderId ?? "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-xs text-white/30 tracking-wider">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (error || !orderId) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="font-display font-700 text-white/40 text-xl mb-3">Order not found</p>
        <p className="font-body text-white/25 text-sm mb-6">
          If you just placed an order, check your email for confirmation.
        </p>
        <Link href="/catalog" className="text-blue-400 hover:text-blue-300 font-mono text-sm transition-colors">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── 1. Confirmation header ─────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-8 md:p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display font-800 text-white text-3xl md:text-4xl mb-2">
          Your order is received
        </h1>
        <p className="font-mono text-sm text-blue-400 tracking-wider">
          Order #{orderNum} is on hold pending payment
        </p>
      </div>

      {/* ── 2. Order summary ───────────────────────────────────────────────── */}
      {order && (
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Order Summary</span>
          </div>
          <div className="space-y-2 mb-4">
            {order.lineItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
                <span className="font-body text-sm text-white/55">{item.name} × {item.quantity}</span>
                <span className="font-mono text-sm text-white/55 shrink-0">${parseFloat(item.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="font-mono text-xs text-white/35 tracking-widest uppercase">Total</span>
            <span className="font-display font-800 text-white text-xl">${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* ── 3. Payment instructions ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-6 h-px bg-blue-600" />
          <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
            Complete Your Payment
          </span>
        </div>
        <p className="font-body text-white/40 text-sm mb-5 px-1">
          Send payment using any method below. Always include{" "}
          <span className="font-mono text-blue-400">Order #{orderNum}</span> in the memo.
        </p>

        <div className="space-y-4">

          {/* Ethereum — via Bankful, instant 10% discount */}
          <PaymentBlock icon="Ξ" title="Ethereum" discount="10% instant discount" orderNumber={orderNum} timeline="A secure payment link is emailed to you separately.">
            <p className="font-body text-sm text-white/50">
              Processed via our payment partner Bankful. Your bank statement will show a charge from Anvil Holdings LLC.
            </p>
          </PaymentBlock>

          {/* E-check — via Bankful, instant 10% discount */}
          <PaymentBlock icon="✓" title="E-check" discount="10% instant discount" orderNumber={orderNum} timeline="A secure payment link is emailed to you separately.">
            <p className="font-body text-sm text-white/50">
              Processed via our payment partner Bankful. Your bank statement will show a charge from Anvil Holdings LLC.
            </p>
          </PaymentBlock>

          {/* Zelle */}
          <PaymentBlock icon="⚡" title="Zelle" orderNumber={orderNum} timeline={PAYMENT_DETAILS.zelle.timeline}>
            <DetailRow label="Send to" value={PAYMENT_CONFIG.zelle.phone} />
            <DetailRow label="Name" value={PAYMENT_DETAILS.zelle.recipientName} />
          </PaymentBlock>

          {/* ACH — discount badge */}
          <PaymentBlock
            icon="🏦"
            title="ACH Bank Transfer"
            discount="5% instant discount"
            orderNumber={orderNum}
            timeline={PAYMENT_DETAILS.ach.timeline}
          >
            <DetailRow label="Bank"           value={PAYMENT_DETAILS.ach.bankName} />
            <DetailRow label="Routing"        value={PAYMENT_DETAILS.ach.routingNumber} />
            <DetailRow label="Account"        value={PAYMENT_DETAILS.ach.accountNumber} />
            <DetailRow label="Account type"   value={PAYMENT_DETAILS.ach.accountType} />
            <DetailRow label="Beneficiary"    value={PAYMENT_DETAILS.ach.beneficiaryName} />
          </PaymentBlock>

          {/* Crypto — USDC/USDT only; ETH is handled above via the separate Bankful rail */}
          <PaymentBlock
            icon="₮"
            title="USDC / USDT (Crypto)"
            discount="5% instant discount"
            orderNumber={orderNum}
            timeline={PAYMENT_DETAILS.crypto.timeline}
          >
            <DetailRow label="Provider"   value={PAYMENT_DETAILS.crypto.provider} />
            <DetailRow label="Coins"      value="USDC, USDT" />
            <div className="rounded-xl bg-blue-600/5 border border-blue-600/10 px-4 py-3">
              <p className="font-mono text-[10px] text-white/35 tracking-wide leading-relaxed">
                A unique wallet address is auto-generated for your order via NOWPayments.
                Check your confirmation email for the payment link.
              </p>
            </div>
          </PaymentBlock>
        </div>
      </div>

      {/* ── 4. Supporting info ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">

        {order?.email && (
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-body text-sm text-white/50 leading-relaxed pt-1">
              We&apos;ll send a confirmation to{" "}
              <span className="text-white/70">{order.email}</span>{" "}
              once payment is received. Tracking is added when your order ships.
            </p>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="font-body text-sm text-white/50 leading-relaxed pt-1">
            Questions?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400 hover:text-blue-300 transition-colors">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>

        <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-4 py-3">
          <p className="font-mono text-xs text-amber-400/80 tracking-wide">
            ⚠ Orders not paid within {HOLD_DAYS} days are automatically released and inventory returns to stock.
          </p>
        </div>
      </div>

      {/* ── 5. Footer compliance ───────────────────────────────────────────── */}
      <div className="py-4 border-t border-white/5 text-center">
        <p className="font-mono text-[9px] text-white/20 tracking-wide leading-relaxed max-w-2xl mx-auto">
          Anvil Compounds products are intended solely for laboratory and investigational use.
          We do not market, sell, or promote products for human or veterinary consumption,
          therapeutic use, or clinical application. Must be 21+ to purchase.
        </p>
      </div>

      {/* Back link */}
      <div className="text-center pb-4">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 font-body text-sm text-white/25 hover:text-white/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </Link>
      </div>

    </div>
  );
}

// ─── Page shell ────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-24">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">
          <Suspense fallback={
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ConfirmationContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
