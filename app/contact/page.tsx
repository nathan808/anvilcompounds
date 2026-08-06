"use client";

import { useState, FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SUPPORT_EMAIL = "support@anvilcompounds.shop";

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
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
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-display font-700 text-white text-lg mb-2">Message sent</p>
        <p className="font-body text-sm text-white/50">
          We&apos;ll get back to you at the email you provided, usually within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
      <div>
        <label className={labelClass}>Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={inputClass} maxLength={100} />
      </div>
      <div>
        <label className={labelClass}>Email *</label>
        <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@institution.edu" className={inputClass} maxLength={254} />
      </div>
      <div>
        <label className={labelClass}>Message *</label>
        <textarea
          required
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="How can we help?"
          rows={5}
          maxLength={4000}
          className={`${inputClass} resize-none`}
        />
      </div>
      {status === "error" && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
      >
        {submitting ? "Sending..." : "Send Message →"}
      </button>
    </form>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase mb-0.5">{label}</p>
        <p className="font-body text-sm text-white/70">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} className="hover:opacity-80 transition-opacity">{content}</a> : content;
}

export default function ContactPage() {
  return (
    <>
      <Navbar pushDown />
      <main className="bg-navy-950 min-h-screen pt-32 pb-16">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        <div className="fixed top-0 left-0 right-0 z-[60] h-7 flex items-center justify-center bg-navy-800/95 backdrop-blur-sm border-b border-blue-600/10">
          <p className="text-center font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase">
            For laboratory and research use only · Must be 21+ to purchase
          </p>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Contact</span>
            </div>
            <h1 className="font-display font-800 text-white text-4xl mb-2">Get in Touch</h1>
            <p className="font-body text-white/40">
              Questions about an order, a compound, or anything else — reach out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            <div className="space-y-6">
              <InfoRow
                href={`mailto:${SUPPORT_EMAIL}`}
                label="Email"
                value={SUPPORT_EMAIL}
                icon={
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <InfoRow
                href="tel:6196534735"
                label="Phone"
                value="(619) 653-4735"
                icon={
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V19a2 2 0 01-2 2h-1C9.82 21 3 14.18 3 6V5z" />
                  </svg>
                }
              />
              <InfoRow
                label="Location"
                value="8690 Aero Dr Ste 115 #1173, San Diego, CA 92123"
                icon={
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <InfoRow
                label="Response Time"
                value="Usually within one business day"
                icon={
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            <ContactForm />
          </div>

          <p className="font-mono text-[9px] text-white/20 tracking-wide leading-relaxed text-center mt-12 pt-6 border-t border-white/5 max-w-2xl mx-auto">
            Anvil Compounds products are intended solely for laboratory and investigational use.
            We do not market, sell, or promote products for human or veterinary consumption,
            therapeutic use, or clinical application. Must be 21+ to purchase.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
