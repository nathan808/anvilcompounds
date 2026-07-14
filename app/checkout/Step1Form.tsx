"use client";

import { useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useCart } from "@/lib/cartContext";
import { useCheckout } from "@/lib/checkoutContext";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

export default function Step1Form() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal } = useCart();
  const { step1, setStep1, hydrated } = useCheckout();

  const capturedEmailRef = useRef<string | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user?.email && !step1.email) {
      setStep1({ email: user.email, firstName: step1.firstName || user.firstName, lastName: step1.lastName || user.lastName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => () => { if (blurTimerRef.current) clearTimeout(blurTimerRef.current); }, []);

  const handleEmailBlur = () => {
    const email = step1.email.trim();
    if (!EMAIL_RE.test(email)) return;
    if (capturedEmailRef.current === email) return; // already captured this email

    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      capturedEmailRef.current = email;
      fetch("/api/checkout/started", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cartItems: items.map((i) => ({ name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
          subtotal,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }, 500);
  };

  const isValid =
    EMAIL_RE.test(step1.email.trim()) &&
    step1.phone.trim().length > 0 &&
    step1.firstName.trim().length > 0 &&
    step1.lastName.trim().length > 0 &&
    step1.address1.trim().length > 0 &&
    step1.city.trim().length > 0 &&
    step1.state.trim().length > 0 &&
    ZIP_RE.test(step1.zip.trim()) &&
    step1.ruoConfirmed;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    router.push("/checkout/shipping");
  };

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  if (!hydrated) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="font-display font-700 text-white mb-4">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email" required value={step1.email}
              onChange={(e) => setStep1({ email: e.target.value })}
              onBlur={handleEmailBlur}
              placeholder="you@institution.edu" className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input
              type="tel" required value={step1.phone}
              onChange={(e) => setStep1({ phone: e.target.value })}
              placeholder="(555) 000-0000" className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display font-700 text-white mb-4">Shipping Address</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name *</label>
              <input required value={step1.firstName} onChange={(e) => setStep1({ firstName: e.target.value })}
                placeholder="First" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input required value={step1.lastName} onChange={(e) => setStep1({ lastName: e.target.value })}
                placeholder="Last" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Address *</label>
            <input required value={step1.address1} onChange={(e) => setStep1({ address1: e.target.value })}
              placeholder="Street address" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Address Line 2</label>
            <input value={step1.address2} onChange={(e) => setStep1({ address2: e.target.value })}
              placeholder="Apt, suite, lab, floor (optional)" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>City *</label>
              <input required value={step1.city} onChange={(e) => setStep1({ city: e.target.value })}
                placeholder="City" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State *</label>
              <select required value={step1.state} onChange={(e) => setStep1({ state: e.target.value })}
                className={inputClass + " cursor-pointer"}>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>ZIP *</label>
              <input required value={step1.zip} onChange={(e) => setStep1({ zip: e.target.value })}
                placeholder="00000" className={inputClass} maxLength={10} />
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input type="checkbox" className="sr-only" checked={step1.ruoConfirmed}
            onChange={(e) => setStep1({ ruoConfirmed: e.target.checked })} />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${step1.ruoConfirmed ? "bg-blue-600 border-blue-600" : "border-white/20 bg-white/5 group-hover:border-white/40"}`}>
            {step1.ruoConfirmed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>}
          </div>
        </div>
        <p className="font-body text-sm text-white/45 leading-relaxed">
          I confirm that all products purchased are for <strong className="text-white/70">research use only</strong> and not for human or veterinary consumption. I am 21 years of age or older. *
        </p>
      </label>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-display font-700 text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30 flex items-center justify-center gap-2"
      >
        Continue to Shipping →
      </button>
    </form>
  );
}
