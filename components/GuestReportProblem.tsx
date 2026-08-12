"use client";

import { useState, FormEvent } from "react";
import { ISSUE_TYPES, MAX_PHOTO_BYTES, fileToBase64 } from "@/lib/reportProblemClient";

// Guest counterpart to ReportProblemTab (components/AccountDashboard.tsx) —
// no account required, verified server-side by order number + the billing
// email on file for that order instead of a JWT-backed order-ownership
// check. See app/api/orders/report-problem/route.ts for the lookup itself;
// tracking number (if any) is pulled from WC automatically server-side, not
// collected here.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GuestReportProblem() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  const isValid = !!orderNumber && EMAIL_RE.test(email) && !!issueType && description.trim().length > 0 && !photoError;

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
      const res = await fetch("/api/orders/report-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email, issueType, description, ...photoPayload }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setOrderNumber("");
      setEmail("");
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
      <div className="glass-card rounded-2xl p-6 md:p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
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

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
      <p className="font-body text-sm text-white/50">
        No account needed — enter your order number and the email you used at checkout.
      </p>

      <div className="grid grid-cols-2 gap-4">
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
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Used at checkout"
            className={inputClass}
          />
        </div>
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
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300"
      >
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
