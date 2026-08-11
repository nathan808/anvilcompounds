"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import type { AccountDetails } from "@/app/api/account/profile/route";
import type { AccountAddresses, AddressFields } from "@/app/api/account/addresses/route";
import type { OrderSummary } from "@/app/api/account/orders/route";
import { ISSUE_TYPES, MAX_PHOTO_BYTES, fileToBase64 } from "@/lib/reportProblemClient";
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
                  trackingCarrier={detail.trackingCarrier}
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

// ─── Tracking tab ──────────────────────────────────────────────────────────────

// Status copy for orders with no tracking number yet — distinct from
// STATUS_LABELS above, which is written for the Orders tab's badge and stays
// terse/generic ("Processing"); here we're explicitly telling the customer
// what's happening with their shipment.
const TRACKING_STATUS_COPY: Record<string, string> = {
  "on-hold": "Awaiting payment",
  pending: "Awaiting payment",
  processing: "Preparing shipment",
  completed: "Delivered",
  cancelled: "Order cancelled",
  refunded: "Refunded",
  failed: "Payment failed",
};

function trackingUrl(carrier: string, number: string): string | null {
  if (carrier.trim().toUpperCase() !== "USPS") return null;
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(number)}`;
}

function TrackingRow({ order }: { order: OrderSummary }) {
  const url = order.trackingNumber ? trackingUrl(order.trackingCarrier, order.trackingNumber) : null;

  return (
    <div className="glass-card rounded-xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="font-display font-700 text-white text-sm">Order #{order.number}</span>
          <StatusBadge status={order.status} />
        </div>
        <p className="font-mono text-[10px] text-white/30 tracking-wide">{formatDate(order.dateCreated)}</p>
      </div>
      <div className="text-right shrink-0">
        {order.trackingNumber ? (
          <>
            <p className="font-mono text-sm text-white/80">{order.trackingNumber}</p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Track Package →
              </a>
            )}
          </>
        ) : (
          <p className="font-body text-sm text-white/40">
            {TRACKING_STATUS_COPY[order.status] ?? "No tracking yet"}
          </p>
        )}
      </div>
    </div>
  );
}

function TrackingTab({ token }: { token: string }) {
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
          <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-body text-white/40 text-sm">You haven&apos;t placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <TrackingRow key={order.id} order={order} />
      ))}
    </div>
  );
}

// ─── Shared form styles ─────────────────────────────────────────────────────────

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

function StatusMessage({ status, savedText, errorText }: { status: "idle" | "saved" | "error"; savedText: string; errorText?: string }) {
  if (status === "saved") {
    return <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-body text-sm">{savedText}</div>;
  }
  if (status === "error") {
    return <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">{errorText || "Something went wrong. Please try again."}</div>;
  }
  return null;
}

// ─── Account Details tab ────────────────────────────────────────────────────────

function AccountDetailsTab({ token }: { token: string }) {
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [form, setForm] = useState<AccountDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/account/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setDetails(data); setForm(data); });
  }, [token]);

  const set = (k: keyof AccountDetails, v: string) => setForm((p) => (p ? { ...p, [k]: v } : p));

  const isValid = !!form && form.firstName.trim().length > 0 && form.lastName.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !isValid) return;
    setSaving(true);
    setStatus("idle");
    setError("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as AccountDetails & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setDetails(data);
      setForm(data);
      setStatus("saved");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (!form || !details) {
    return <div className="glass-card rounded-2xl p-8 animate-pulse h-72" />;
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
      <div className="pb-5 border-b border-white/5">
        <p className={labelClass}>Email</p>
        <p className="font-body text-sm text-white/70 mb-3">{details.email}</p>
        <p className="font-mono text-[10px] text-white/25 tracking-wide leading-relaxed">
          Email and date of birth are tied to your sign-in and can&apos;t be changed here —
          contact support@anvilcompounds.shop to update either.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>First Name *</label>
          <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputClass} maxLength={60} />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputClass} maxLength={60} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 555-5555" className={inputClass} />
      </div>

      <StatusMessage status={status} savedText="Account details updated." errorText={error} />

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

// ─── Addresses tab ───────────────────────────────────────────────────────────────

const BLANK_ADDRESS: AddressFields = { firstName: "", lastName: "", address1: "", address2: "", city: "", state: "", zip: "" };

function AddressFieldset({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AddressFields;
  onChange: (next: AddressFields) => void;
}) {
  const set = (k: keyof AddressFields, v: string) => onChange({ ...value, [k]: v });
  return (
    <div>
      <p className="font-mono text-xs text-blue-400 tracking-[0.2em] uppercase mb-4">{label}</p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input value={value.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="First name" className={inputClass} />
          <input value={value.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Last name" className={inputClass} />
        </div>
        <input value={value.address1} onChange={(e) => set("address1", e.target.value)} placeholder="Address line 1" className={inputClass} />
        <input value={value.address2} onChange={(e) => set("address2", e.target.value)} placeholder="Address line 2 (optional)" className={inputClass} />
        <div className="grid grid-cols-2 gap-4">
          <input value={value.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className={inputClass} />
          <select value={value.state} onChange={(e) => set("state", e.target.value)} className={inputClass}>
            <option value="">State</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <input
          value={value.zip}
          onChange={(e) => set("zip", e.target.value)}
          placeholder="ZIP code"
          className={`${inputClass} max-w-[160px]`}
        />
      </div>
    </div>
  );
}

function isAddressBlank(a: AddressFields): boolean {
  return !a.firstName.trim() && !a.lastName.trim() && !a.address1.trim() &&
    !a.address2.trim() && !a.city.trim() && !a.state.trim() && !a.zip.trim();
}

function isAddressComplete(a: AddressFields): boolean {
  return !!a.firstName.trim() && !!a.lastName.trim() && !!a.address1.trim() &&
    !!a.city.trim() && !!a.state.trim() && ZIP_RE.test(a.zip.trim());
}

function AddressesTab({ token }: { token: string }) {
  const [addresses, setAddresses] = useState<AccountAddresses | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/account/addresses", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAddresses);
  }, [token]);

  const isValid = !!addresses &&
    (isAddressBlank(addresses.billing) || isAddressComplete(addresses.billing)) &&
    (isAddressBlank(addresses.shipping) || isAddressComplete(addresses.shipping));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!addresses || !isValid) return;
    setSaving(true);
    setStatus("idle");
    setError("");
    try {
      const res = await fetch("/api/account/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(addresses),
      });
      const data = (await res.json()) as AccountAddresses & { error?: string };
      if (!res.ok || data.error) {
        setError((data as { error?: string }).error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setAddresses(data);
      setStatus("saved");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (!addresses) {
    return <div className="glass-card rounded-2xl p-8 animate-pulse h-96" />;
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-8">
      <AddressFieldset
        label="Billing Address"
        value={addresses.billing}
        onChange={(billing) => setAddresses({ ...addresses, billing })}
      />
      <AddressFieldset
        label="Shipping Address"
        value={addresses.shipping}
        onChange={(shipping) => setAddresses({ ...addresses, shipping })}
      />

      {status === "saved" && <StatusMessage status="saved" savedText="Addresses updated." />}
      {status === "error" && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
          {error || "Something went wrong. Please try again."}
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

// ─── Contact Support tab ─────────────────────────────────────────────────────────

function ContactSupportTab({ token, email }: { token: string; email: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const isValid = subject.trim().length > 0 && message.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setStatus("idle");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: email, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setSubject("");
      setMessage("");
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "sent") {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="font-display font-700 text-white text-lg mb-2">Message sent</p>
        <p className="font-body text-sm text-white/50 mb-4">
          We&apos;ll get back to you at {email}, usually within one business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
      <p className="font-body text-sm text-white/50">
        Sent to our support team from {email} — we&apos;ll reply there.
      </p>
      <div>
        <label className={labelClass}>Subject *</label>
        <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" className={inputClass} maxLength={200} />
      </div>
      <div>
        <label className={labelClass}>Message *</label>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          rows={6}
          maxLength={4000}
          className={`${inputClass} resize-none`}
        />
      </div>
      {status === "error" && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={submitting || !isValid}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
      >
        {submitting ? "Sending..." : "Send Message →"}
      </button>
    </form>
  );
}

// ─── Report a Problem tab ─────────────────────────────────────────────────────────

function ReportProblemTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [orderId, setOrderId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/account/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [token]);

  const isValid = !!orderId && !!issueType && description.trim().length > 0 && !photoError;

  // Pre-fills from the order's tracking number on file (already fetched via
  // /api/account/orders) when the customer picks an order that has one —
  // still editable, since they may be quoting a different/corrected number.
  const handleOrderChange = (id: string) => {
    setOrderId(id);
    const selected = orders?.find((o) => String(o.id) === id);
    setTrackingNumber(selected?.trackingNumber ?? "");
  };

  const handlePhotoChange = (file: File | null) => {
    setPhotoError("");
    if (file && file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Photo must be under 4MB.");
      setPhoto(null);
      return;
    }
    setPhoto(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setStatus("idle");
    setError("");
    try {
      const photoPayload = photo
        ? { photoBase64: await fileToBase64(photo), photoFilename: photo.name, photoMimeType: photo.type }
        : {};
      const res = await fetch("/api/account/report-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: Number(orderId),
          trackingNumber: trackingNumber.trim() || undefined,
          issueType,
          description,
          ...photoPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setOrderId("");
      setTrackingNumber("");
      setIssueType("");
      setDescription("");
      setPhoto(null);
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "sent") {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="font-display font-700 text-white text-lg mb-2">Report submitted</p>
        <p className="font-body text-sm text-white/50 mb-4">
          Our support team has been notified and will follow up by email, usually within one business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Report another issue
        </button>
      </div>
    );
  }

  if (!orders) {
    return <div className="glass-card rounded-2xl p-8 animate-pulse h-96" />;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-body text-white/40 text-sm">You don&apos;t have any orders to report an issue with yet.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
      <div>
        <label className={labelClass}>Order *</label>
        <select required value={orderId} onChange={(e) => handleOrderChange(e.target.value)} className={inputClass}>
          <option value="">Select an order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              #{o.number} — {formatDate(o.dateCreated)} — {o.itemSummary}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Tracking Number (optional)</label>
        <input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Auto-filled if we have one on file"
          className={inputClass}
          maxLength={100}
        />
      </div>

      <div>
        <label className={labelClass}>Issue Type *</label>
        <select required value={issueType} onChange={(e) => setIssueType(e.target.value)} className={inputClass}>
          <option value="">Select an issue</option>
          {ISSUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us what happened"
          rows={5}
          maxLength={2000}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className={labelClass}>Photo (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-white/50 font-body file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:font-mono file:text-xs file:cursor-pointer hover:file:bg-white/15"
        />
        {photoError && <p className="font-mono text-[10px] text-red-400 mt-1.5">{photoError}</p>}
      </div>

      {status === "error" && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting || !isValid}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
      >
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}

// ─── Dashboard shell ────────────────────────────────────────────────────────────

const TABS = ["orders", "tracking", "addresses", "details", "support", "report"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  orders: "Orders",
  tracking: "Tracking",
  addresses: "Addresses",
  details: "Account Details",
  support: "Contact Support",
  report: "Report a Problem",
};

export default function AccountDashboard() {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  // Lets the homepage "Track an Order" CTA (/account?tab=tracking) land
  // directly on the Tracking tab instead of defaulting to Orders.
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    (TABS as readonly string[]).includes(requestedTab ?? "") ? (requestedTab as Tab) : "orders"
  );

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

        {/* Simple header tabs — underline style, standard ecom-account pattern.
            Horizontally scrollable (overflow-x-auto + whitespace-nowrap) since
            six tabs don't fit the max-w-2xl container on narrow screens. */}
        <div className="flex items-center gap-6 border-b border-white/10 mb-6 overflow-x-auto whitespace-nowrap">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 -mb-px shrink-0 font-display font-600 text-sm border-b-2 transition-colors duration-200 ${
                tab === t
                  ? "border-blue-500 text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "orders" && <OrdersTab token={user.token} />}
        {tab === "tracking" && <TrackingTab token={user.token} />}
        {tab === "addresses" && <AddressesTab token={user.token} />}
        {tab === "details" && <AccountDetailsTab token={user.token} />}
        {tab === "support" && <ContactSupportTab token={user.token} email={user.email} />}
        {tab === "report" && <ReportProblemTab token={user.token} />}

        <p className="font-mono text-[9px] text-white/20 tracking-wide leading-relaxed text-center mt-10 pt-6 border-t border-white/5">
          Anvil Compounds products are intended solely for laboratory and investigational use.
          We do not market, sell, or promote products for human or veterinary consumption,
          therapeutic use, or clinical application. Must be 21+ to purchase.
        </p>
      </div>
    </div>
  );
}
