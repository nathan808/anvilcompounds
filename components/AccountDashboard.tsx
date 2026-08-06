"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import type { AccountProfile } from "@/app/api/account/profile/route";
import type { OrderSummary } from "@/app/api/account/orders/route";
import type { AccountOrderDetail } from "@/app/api/account/orders/[id]/route";
import OrderDetailBody from "@/components/OrderDetailBody";
import Link from "next/link";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const ZIP_RE = /^\d{5}(-\d{4})?$/;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-600 uppercase border shrink-0 ${STATUS_STYLES[status] ?? "bg-white/10 text-white/50 border-white/15"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Orders tab ────────────────────────────────────────────────────────────────

function OrderRow({ order, token }: { order: OrderSummary; token: string }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AccountOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(() => {
    setOpen((o) => !o);
    if (!detail && !loading) {
      setLoading(true);
      fetch(`/api/account/orders/${order.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setDetail(data))
        .finally(() => setLoading(false));
    }
  }, [detail, loading, order.id, token]);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="font-display font-700 text-white text-sm">Order #{order.number}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="font-body text-xs text-white/40 truncate max-w-md">{order.itemSummary}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="font-mono text-[10px] text-white/30 tracking-wide">{formatDate(order.dateCreated)}</p>
            <p className="font-display font-700 text-white text-sm">${parseFloat(order.total).toFixed(2)}</p>
          </div>
          <svg className={`w-4 h-4 text-white/30 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-white/5">
              {loading ? (
                <div className="py-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : detail ? (
                <OrderDetailBody
                  orderId={order.id}
                  status={detail.status}
                  paymentMethod={detail.paymentMethod}
                  orderKey={detail.orderKey}
                  lineItems={detail.lineItems}
                  billingAddress={detail.billingAddress}
                  trackingNumber={detail.trackingNumber}
                  shipmentUpdates={detail.shipmentUpdates}
                />
              ) : (
                <p className="font-body text-sm text-white/30 pt-4">Could not load order details.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/account/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<OrderSummary[]>;
      })
      .then(setOrders)
      .catch(() => setError(true));
  }, [token]);

  if (error) {
    return <p className="font-body text-sm text-white/30 text-center py-12">Could not load your orders. Please try again later.</p>;
  }

  if (!orders) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-body text-white/40 text-sm mb-4">You haven&apos;t placed any orders yet.</p>
        <a href="/catalog?catalog=full" className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm rounded-md transition-all duration-300">
          Browse Catalog
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} token={token} />
      ))}
    </div>
  );
}

// ─── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ token }: { token: string }) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [form, setForm] = useState<AccountProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/account/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setProfile(data); setForm(data); });
  }, [token]);

  const set = (k: keyof AccountProfile, v: string) => setForm((p) => (p ? { ...p, [k]: v } : p));

  const isValid = !!form &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    (form.zip.trim() === "" || ZIP_RE.test(form.zip.trim()));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !isValid) return;
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as AccountProfile;
      setProfile(updated);
      setForm(updated);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  if (!form || !profile) {
    return (
      <div className="glass-card rounded-2xl p-8 animate-pulse h-96" />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
      {/* Read-only credentials */}
      <div className="pb-5 border-b border-white/5">
        <p className={labelClass}>Email</p>
        <p className="font-body text-sm text-white/70 mb-3">{profile.email}</p>
        <p className="font-mono text-[10px] text-white/25 tracking-wide leading-relaxed">
          Email and date of birth are tied to your sign-in and can&apos;t be changed here —
          contact support@anvilcompounds.shop to update either.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>First Name *</label>
          <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 555-5555" className={inputClass} />
      </div>

      <div className="pt-3">
        <p className="font-mono text-xs text-blue-400 tracking-[0.2em] uppercase mb-4">Shipping Address</p>
        <div className="space-y-4">
          <input value={form.address1} onChange={(e) => set("address1", e.target.value)} placeholder="Address line 1" className={inputClass} />
          <input value={form.address2} onChange={(e) => set("address2", e.target.value)} placeholder="Address line 2 (optional)" className={inputClass} />
          <div className="grid grid-cols-2 gap-4">
            <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className={inputClass} />
            <select value={form.state} onChange={(e) => set("state", e.target.value)} className={inputClass}>
              <option value="">State</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <input
            value={form.zip}
            onChange={(e) => set("zip", e.target.value)}
            placeholder="ZIP code"
            className={`${inputClass} max-w-[160px]`}
          />
        </div>
      </div>

      {status === "saved" && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-body text-sm">
          Profile updated.
        </div>
      )}
      {status === "error" && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
          Something went wrong. Please try again.
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !isValid}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

// ─── Dashboard shell ────────────────────────────────────────────────────────────

export default function AccountDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"orders" | "profile">("orders");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-16">
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">My Account</span>
            </div>
            <h1 className="font-display font-800 text-white text-2xl md:text-3xl">
              {user.firstName ? `Welcome, ${user.firstName}` : "Your Account"}
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/contact"
              className="font-mono text-xs text-white/30 hover:text-white/60 tracking-wide transition-colors"
            >
              Contact Support
            </Link>
            <button
              onClick={logout}
              className="font-mono text-xs text-white/30 hover:text-white/60 tracking-wide transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Simple header tabs — underline style, standard ecom-account pattern */}
        <div className="flex items-center gap-6 border-b border-white/10 mb-6">
          {(["orders", "profile"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 -mb-px font-display font-600 text-sm border-b-2 transition-colors duration-200 ${
                tab === t
                  ? "border-blue-500 text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t === "orders" ? "Orders" : "Profile"}
            </button>
          ))}
        </div>

        {tab === "orders" ? <OrdersTab token={user.token} /> : <ProfileTab token={user.token} />}

        <p className="font-mono text-[9px] text-white/20 tracking-wide leading-relaxed text-center mt-10 pt-6 border-t border-white/5">
          Anvil Compounds products are intended solely for laboratory and investigational use.
          We do not market, sell, or promote products for human or veterinary consumption,
          therapeutic use, or clinical application. Must be 21+ to purchase.
        </p>
      </div>
    </div>
  );
}
