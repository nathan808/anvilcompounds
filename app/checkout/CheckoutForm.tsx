"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import { useAuth } from "@/lib/authContext";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  half?: boolean;
  options?: string[];
}

export default function CheckoutForm() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address1: "", address2: "", city: "", state: "CA", zip: "", notes: "",
  });

  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }));
    }
  }, [user]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmed) { setError("Please confirm research use before proceeding."); return; }
    if (items.length === 0) { setError("Your cart is empty."); return; }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, billing: form, notes: form.notes, ruoConfirmed: confirmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Unknown error");

      // Always store order details so the confirmation page has them on return
      sessionStorage.setItem("anvil_order", JSON.stringify({
        orderId:     data.orderId,
        orderNumber: data.orderNumber,
        email:       form.email,
        items,
        subtotal,
      }));

      clearCart();

      // If Bankful returned a payment link, send the customer there to pay.
      // On return, Bankful redirects back and the confirmation page reads sessionStorage.
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push(`/order-confirmation?order=${data.orderId}`);
      }
    } catch {
      setError("Something went wrong. Please try again or contact support@anvilcompounds.shop");
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact */}
      <div>
        <h3 className="font-display font-700 text-white mb-4">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="you@institution.edu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 000-0000" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div>
        <h3 className="font-display font-700 text-white mb-4">Shipping Address</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
                placeholder="First" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
                placeholder="Last" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Address *</label>
            <input required value={form.address1} onChange={(e) => set("address1", e.target.value)}
              placeholder="Street address" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Address Line 2</label>
            <input value={form.address2} onChange={(e) => set("address2", e.target.value)}
              placeholder="Apt, suite, lab, floor (optional)" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>City *</label>
              <input required value={form.city} onChange={(e) => set("city", e.target.value)}
                placeholder="City" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State *</label>
              <select required value={form.state} onChange={(e) => set("state", e.target.value)}
                className={inputClass + " cursor-pointer"}>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>ZIP *</label>
              <input required value={form.zip} onChange={(e) => set("zip", e.target.value)}
                placeholder="00000" className={inputClass} maxLength={10} />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Order Notes (optional)</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
          placeholder="Research context, special instructions, etc."
          rows={3} className={inputClass + " resize-none"} />
      </div>

      {/* RUO confirmation */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input type="checkbox" className="sr-only" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${confirmed ? "bg-blue-600 border-blue-600" : "border-white/20 bg-white/5 group-hover:border-white/40"}`}>
            {confirmed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>}
          </div>
        </div>
        <p className="font-body text-sm text-white/45 leading-relaxed">
          I confirm that all products purchased are for <strong className="text-white/70">research use only</strong> and not for human or veterinary consumption. I am 21 years of age or older. *
        </p>
      </label>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-display font-700 text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Reserving Order...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Continue to Secure Checkout →
          </>
        )}
      </button>

      {/* Trust row */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pt-1">
        {[
          ["🚚", "Same-day dispatch by 12PM PST"],
          ["🔒", "Secure, encrypted checkout"],
          ["📦", "Discreet packaging"],
        ].map(([icon, text]) => (
          <span key={text as string} className="flex items-center gap-1 font-mono text-[10px] text-white/30 tracking-wide">
            <span>{icon}</span>{text}
          </span>
        ))}
      </div>
      <p className="text-center font-mono text-[9px] text-white/20 tracking-wide">
        By completing your order you agree to our{" "}
        <a href="/privacy-policy-page" target="_blank" className="underline underline-offset-2 hover:text-white/40 transition-colors">
          Privacy Policy
        </a>
        {" "}and{" "}
        <a href="/terms-of-use-page" target="_blank" className="underline underline-offset-2 hover:text-white/40 transition-colors">
          Terms of Use
        </a>
      </p>
    </form>
  );
}
