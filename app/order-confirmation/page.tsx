"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PAYMENT_DETAILS, HOLD_DAYS, SUPPORT_EMAIL } from "@/lib/paymentConfig";
import type { OrderDetail } from "@/app/api/orders/[id]/route";

// ─── Discount badge ────────────────────────────────────────────────────────────

function DiscountBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-600 bg-amber-500/15 text-amber-400 border border-amber-500/25">
      ✦ {text}
    </span>
  );
}

// ─── Manual payment block ──────────────────────────────────────────────────────

function PaymentBlock({
  icon, title, discount, children, orderNumber, timeline,
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
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-display font-700 text-white text-lg">{title}</h3>
          </div>
          {discount && <DiscountBadge text={discount} />}
        </div>
        <div className="space-y-2 mb-4">{children}</div>
        <div className="rounded-xl bg-blue-600/8 border border-blue-600/15 px-4 py-3 mb-3">
          <p className="font-mono text-xs text-blue-400 tracking-wide">
            Note in payment memo: <span className="text-white font-600">Order #{orderNumber}</span>
          </p>
        </div>
        <p className="font-mono text-[10px] text-white/30 tracking-wide">{timeline}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
      <span className="font-mono text-[10px] text-white/35 tracking-widest uppercase shrink-0">{label}</span>
      <span className="font-body text-sm text-white/70 text-right break-all">{value}</span>
    </div>
  );
}

// ─── Crypto payment section ────────────────────────────────────────────────────

function CryptoPaymentSection({
  order,
  status,
}: {
  order: OrderDetail;
  status: string;
}) {
  const isConfirmed = status === "processing" || status === "completed";

  if (isConfirmed) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display font-800 text-white text-2xl mb-2">Payment Confirmed</h3>
          <p className="font-body text-white/50 text-sm">
            Your crypto payment was received. Your order is being processed and will ship soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">₿</span>
          <h3 className="font-display font-700 text-white text-lg">Complete Your Crypto Payment</h3>
        </div>
        <p className="font-body text-sm text-white/45 mb-5 ml-9">
          Your order is reserved. Click below to open the NOWPayments checkout and complete payment.
        </p>

        {order.paymentUrl && (
          <a
            href={order.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 mb-4"
          >
            Open Payment Page
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-4 py-3 mb-3">
          <p className="font-mono text-xs text-amber-400 tracking-wide">
            Reference:{" "}
            <span className="text-white font-600">Order #{order.number}</span>
            <span className="text-white/30 ml-2">— include this if asked</span>
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="font-mono text-[10px] text-white/30 tracking-wide">
            Waiting for payment confirmation… this page updates automatically
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {["USDC", "USDT", "BTC", "ETH", "LTC", "XRP"].map((coin) => (
            <div key={coin} className="rounded-lg bg-white/3 border border-white/6 px-2 py-1.5 text-center">
              <span className="font-mono text-[10px] text-white/40 tracking-wider">{coin}</span>
            </div>
          ))}
        </div>
      </div>
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const r = await fetch(`/api/orders/${orderId}`);
      if (!r.ok) throw new Error();
      const data: OrderDetail = await r.json();
      setOrder(data);
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!orderId) { setLoading(false); setError(true); return; }

    fetchOrder()
      .then((data) => {
        if (!data) {
          // Try sessionStorage fallback
          try {
            const stored = sessionStorage.getItem("anvil_order");
            if (stored) {
              const s = JSON.parse(stored) as {
                orderId: number; orderNumber: string; email: string;
                items: { name: string; size: string; price: number; quantity: number }[];
                subtotal: number;
              };
              setOrder({
                id: s.orderId, number: s.orderNumber, status: "on-hold",
                total: s.subtotal.toFixed(2), currency: "USD",
                email: s.email, firstName: "", lastName: "",
                lineItems: s.items.map((i) => ({
                  name: `${i.name} — ${i.size}`, quantity: i.quantity,
                  total: (i.price * i.quantity).toFixed(2),
                })),
                paymentMethod: "bacs",
                paymentUrl: null,
              });
            } else {
              setError(true);
            }
          } catch { setError(true); }
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Status polling for crypto orders
  useEffect(() => {
    if (!order || order.paymentMethod !== "nowpayments") return;
    const alreadyDone = order.status === "processing" || order.status === "completed";
    if (alreadyDone) return;

    pollRef.current = setInterval(async () => {
      const updated = await fetchOrder();
      if (
        updated &&
        (updated.status === "processing" || updated.status === "completed")
      ) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.paymentMethod, order?.status]);

  const isCrypto = order?.paymentMethod === "nowpayments";
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
        <Link href="/#catalog" className="text-blue-400 hover:text-blue-300 font-mono text-sm transition-colors">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── 1. Header ─────────────────────────────────────────────────────────── */}
      <div className={`glass-card rounded-2xl p-8 md:p-10 text-center overflow-hidden relative`}>
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isCrypto ? "via-amber-500/60" : "via-green-500/40"} to-transparent`} />
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isCrypto ? "bg-amber-500/10 border border-amber-500/20" : "bg-green-500/10 border border-green-500/20"}`}>
          {isCrypto ? (
            <span className="text-3xl">₿</span>
          ) : (
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <h1 className="font-display font-800 text-white text-3xl md:text-4xl mb-2">
          Your order is received
        </h1>
        <p className={`font-mono text-sm tracking-wider ${isCrypto ? "text-amber-400" : "text-blue-400"}`}>
          Order #{orderNum} —{" "}
          {isCrypto ? "awaiting crypto payment" : "on hold pending payment"}
        </p>
      </div>

      {/* ── 2. Order summary ─────────────────────────────────────────────────── */}
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
          {isCrypto && (
            <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5">
              <span className="font-body text-sm text-amber-400/70">Crypto discount (10%)</span>
              <span className="font-mono text-sm text-amber-400/70">
                −${(parseFloat(order.total) * (1/9) || 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3">
            <span className="font-mono text-xs text-white/35 tracking-widest uppercase">
              {isCrypto ? "You pay" : "Total"}
            </span>
            <span className={`font-display font-800 text-xl ${isCrypto ? "text-amber-400" : "text-white"}`}>
              ${parseFloat(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ── 3. Payment instructions ──────────────────────────────────────────── */}
      {isCrypto && order ? (
        <CryptoPaymentSection order={order} status={order.status} />
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Complete Your Payment</span>
          </div>
          <p className="font-body text-white/40 text-sm mb-5 px-1">
            Send payment using any method below. Always include{" "}
            <span className="font-mono text-blue-400">Order #{orderNum}</span> in the memo.
          </p>

          <div className="space-y-4">
            <PaymentBlock icon="⚡" title="Zelle" orderNumber={orderNum} timeline={PAYMENT_DETAILS.zelle.timeline}>
              <DetailRow label="Send to" value={PAYMENT_DETAILS.zelle.handle} />
              <DetailRow label="Name"    value={PAYMENT_DETAILS.zelle.recipientName} />
            </PaymentBlock>

            <PaymentBlock icon="💚" title="CashApp" orderNumber={orderNum} timeline={PAYMENT_DETAILS.cashapp.timeline}>
              <DetailRow label="Cashtag" value={PAYMENT_DETAILS.cashapp.cashtag} />
              <DetailRow label="Name"    value={PAYMENT_DETAILS.cashapp.recipientName} />
            </PaymentBlock>

            <PaymentBlock icon="🍎" title="Apple Cash" orderNumber={orderNum} timeline={PAYMENT_DETAILS.applecash.timeline}>
              <DetailRow label="Send to" value={PAYMENT_DETAILS.applecash.phone} />
              <DetailRow label="Name"    value={PAYMENT_DETAILS.applecash.recipientName} />
            </PaymentBlock>

            <PaymentBlock
              icon="🏦" title="ACH Bank Transfer"
              discount={PAYMENT_DETAILS.ach.discount}
              orderNumber={orderNum} timeline={PAYMENT_DETAILS.ach.timeline}
            >
              <DetailRow label="Bank"        value={PAYMENT_DETAILS.ach.bankName} />
              <DetailRow label="Routing"     value={PAYMENT_DETAILS.ach.routingNumber} />
              <DetailRow label="Account"     value={PAYMENT_DETAILS.ach.accountNumber} />
              <DetailRow label="Type"        value={PAYMENT_DETAILS.ach.accountType} />
              <DetailRow label="Beneficiary" value={PAYMENT_DETAILS.ach.beneficiaryName} />
            </PaymentBlock>

            <PaymentBlock
              icon="₿" title="Crypto (USDC / USDT / BTC / ETH)"
              discount={PAYMENT_DETAILS.crypto.discount}
              orderNumber={orderNum} timeline={PAYMENT_DETAILS.crypto.timeline}
            >
              <DetailRow label="Provider" value={PAYMENT_DETAILS.crypto.provider} />
              <DetailRow label="Coins"    value={PAYMENT_DETAILS.crypto.supportedCoins} />
              <div className="rounded-xl bg-blue-600/5 border border-blue-600/10 px-4 py-3">
                <p className="font-mono text-[10px] text-white/35 tracking-wide leading-relaxed">
                  A unique wallet address is auto-generated for your order via NOWPayments.
                  Check your confirmation email for the payment link.
                </p>
              </div>
            </PaymentBlock>
          </div>
        </div>
      )}

      {/* ── 4. Supporting info ───────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        {order?.email && (
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-body text-sm text-white/50 leading-relaxed pt-1">
              We&apos;ll send confirmation to{" "}
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

      {/* ── 5. Footer compliance ─────────────────────────────────────────────── */}
      <div className="py-4 border-t border-white/5 text-center">
        <p className="font-mono text-[9px] text-white/20 tracking-wide leading-relaxed max-w-2xl mx-auto">
          Anvil Compounds products are intended solely for laboratory and investigational use.
          We do not market, sell, or promote products for human or veterinary consumption,
          therapeutic use, or clinical application. Must be 21+ to purchase.
        </p>
      </div>

      <div className="text-center pb-4">
        <Link href="/#catalog" className="inline-flex items-center gap-2 font-body text-sm text-white/25 hover:text-white/50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </Link>
      </div>
    </div>
  );
}

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
