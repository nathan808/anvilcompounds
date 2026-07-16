"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Suspense } from "react";

const RESEARCH_PURPOSES = [
  { value: "scientist", label: "Scientist" },
  { value: "research_associate", label: "Research Associate" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "independent_researcher", label: "Independent Researcher" },
] as const;

function humanError(code: string | null | undefined, fallback: string): string {
  if (code === "AUTH_NOT_CONFIGURED") {
    return "Account login is being configured. Please contact support@anvilcompounds.shop.";
  }
  if (code === "API_READ_ONLY") {
    return "Account creation is temporarily unavailable. Please contact support@anvilcompounds.shop.";
  }
  if (code === "EMAIL_EXISTS") {
    return "An account with that email already exists. Please sign in.";
  }
  return fallback;
}

// Auto-format birthday input as MM/DD/YYYY while typing
function formatBirthday(raw: string, prev: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

type TwoFactorStep = "idle" | "sending" | "enter_code" | "verifying";

function AccountForm() {
  const { login, register, sendTwoFactor, verifyTwoFactor, isAuthenticated, hydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [tab, setTab] = useState<"create" | "signin">("create");
  const [form, setForm] = useState({
    email: "",
    birthday: "",
    firstName: "",
    lastName: "",
    researchPurpose: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 2FA state
  const [twoFactorStep, setTwoFactorStep] = useState<TwoFactorStep>("idle");
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleBirthdayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBirthday(e.target.value, form.birthday);
    set("birthday", formatted);
  }, [form.birthday]);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(redirect);
  }, [hydrated, isAuthenticated, redirect, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "create") {
      if (!form.email || !form.firstName || !form.lastName || !form.birthday || !form.researchPurpose) {
        setError("All fields are required.");
        return;
      }
    } else {
      if (!form.email || !form.birthday) {
        setError("Email and date of birth are required.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (tab === "create") {
        await register(
          form.email.toLowerCase().trim(),
          form.birthday,
          form.firstName.trim(),
          form.lastName.trim(),
          form.researchPurpose
        );
      } else {
        await login(form.email.toLowerCase().trim(), form.birthday);
      }
      router.push(redirect);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(humanError(e.code, e.message ?? "Something went wrong. Please try again."));
      setSubmitting(false);
    }
  };

  const handleSendTwoFactor = async () => {
    setTwoFactorError("");
    if (!twoFactorEmail) {
      setTwoFactorError("Please enter your email.");
      return;
    }
    setTwoFactorStep("sending");
    try {
      await sendTwoFactor(twoFactorEmail);
      setTwoFactorStep("enter_code");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setTwoFactorError(e.message ?? "Failed to send code. Please try again.");
      setTwoFactorStep("idle");
    }
  };

  const handleVerifyTwoFactor = async () => {
    setTwoFactorError("");
    if (!twoFactorCode) {
      setTwoFactorError("Please enter your access code.");
      return;
    }
    setTwoFactorStep("verifying");
    try {
      await verifyTwoFactor(twoFactorEmail, twoFactorCode);
      router.push(redirect);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setTwoFactorError(e.message ?? "Invalid or expired code. Please try again.");
      setTwoFactorStep("enter_code");
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass =
    "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";
  const selectClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl text-white font-body text-sm outline-none transition-all duration-300 appearance-none cursor-pointer";

  // ── 2FA panel ──────────────────────────────────────────────────────────────
  if (twoFactorStep !== "idle" || twoFactorEmail !== "") {
    const onCodeStep = twoFactorStep === "enter_code" || twoFactorStep === "verifying";
    const tfBusy = twoFactorStep === "sending" || twoFactorStep === "verifying";

    return (
      <div className="min-h-screen bg-navy-950 pt-24">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-lg mx-auto px-6 py-16">

          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">Access Code</span>
              <div className="w-6 h-px bg-blue-600" />
            </div>
            <h1 className="font-display font-800 text-white text-3xl mb-2">Verify Your Identity</h1>
            <p className="font-body text-white/40 text-sm">
              {onCodeStep
                ? `Enter the 6-digit code sent to ${twoFactorEmail}`
                : "We'll send a one-time code to your registered email."}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-5">
            {!onCodeStep && (
              <>
                <div>
                  <label className={labelClass}>Your Email</label>
                  <input
                    type="email"
                    value={twoFactorEmail}
                    onChange={(e) => setTwoFactorEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                {twoFactorError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
                    {twoFactorError}
                  </div>
                )}
                <button
                  onClick={handleSendTwoFactor}
                  disabled={tfBusy}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
                >
                  {tfBusy ? "Sending Code..." : "Send Access Code →"}
                </button>
              </>
            )}

            {onCodeStep && (
              <>
                <div>
                  <label className={labelClass}>Access Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className={`${inputClass} text-center text-xl tracking-[0.5em]`}
                    autoFocus
                  />
                </div>
                {twoFactorError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
                    {twoFactorError}
                  </div>
                )}
                <button
                  onClick={handleVerifyTwoFactor}
                  disabled={tfBusy}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
                >
                  {tfBusy ? "Verifying..." : "Verify & Sign In →"}
                </button>
                <button
                  type="button"
                  onClick={() => { setTwoFactorStep("idle"); setTwoFactorCode(""); setTwoFactorError(""); }}
                  className="w-full text-center text-white/30 hover:text-white/60 font-body text-sm transition-colors"
                >
                  Resend code
                </button>
              </>
            )}
          </div>

          <p className="text-center mt-6 font-body text-sm text-white/30">
            <button
              type="button"
              onClick={() => { setTwoFactorEmail(""); setTwoFactorStep("idle"); setTwoFactorCode(""); setTwoFactorError(""); }}
              className="hover:text-white/60 transition-colors"
            >
              ← Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Normal sign-in / create form ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-navy-950 pt-24">
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
      <div className="relative z-10 max-w-lg mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
              Researcher Access
            </span>
            <div className="w-6 h-px bg-blue-600" />
          </div>
          <h1 className="font-display font-800 text-white text-3xl mb-2">
            {tab === "create" ? "Create Account" : "Sign In"}
          </h1>
          <p className="font-body text-white/40 text-sm">
            {redirect === "/checkout"
              ? "An account is required to place an order."
              : redirect === "/coas" || redirect.startsWith("/products/")
              ? "Sign in to view this COA."
              : "Access your Anvil Compounds research account."}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex glass-card rounded-xl p-1 mb-8">
          {(["create", "signin"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg font-display font-600 text-sm transition-all duration-200 ${
                tab === t
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "create" ? "Create Account" : "Sign In"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name fields — create tab only */}
            <AnimatePresence mode="wait">
              {tab === "create" && (
                <motion.div
                  key="create-names"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className={labelClass}>First Name *</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="First"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name *</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      placeholder="Last"
                      className={inputClass}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@institution.edu"
                className={inputClass}
              />
            </div>

            {/* Date of Birth (replaces password) */}
            <div>
              <label className={labelClass}>Date of Birth *</label>
              <input
                type="text"
                required
                value={form.birthday}
                onChange={handleBirthdayChange}
                placeholder="MM / DD / YYYY"
                className={inputClass}
                maxLength={10}
                inputMode="numeric"
              />
            </div>

            {/* Research Purpose — create tab only */}
            <AnimatePresence mode="wait">
              {tab === "create" && (
                <motion.div
                  key="research-purpose"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className={labelClass}>Research Purpose *</label>
                  <div className="relative">
                    <select
                      required
                      value={form.researchPurpose}
                      onChange={(e) => set("researchPurpose", e.target.value)}
                      className={`${selectClass} ${!form.researchPurpose ? "text-white/20" : "text-white"}`}
                    >
                      <option value="" disabled hidden>Select your role</option>
                      {RESEARCH_PURPOSES.map((p) => (
                        <option key={p.value} value={p.value} className="bg-navy-900 text-white">
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-body text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30 mt-2"
            >
              {submitting
                ? tab === "create" ? "Creating Account..." : "Signing In..."
                : tab === "create" ? "Create Account & Continue →" : "Sign In →"}
            </button>

            {/* Forgot birthday — sign in tab only */}
            {tab === "signin" && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setTwoFactorEmail(form.email); setTwoFactorStep("idle"); }}
                  className="font-body text-xs text-white/25 hover:text-blue-400/70 transition-colors"
                >
                  Forgot your date of birth? Get a one-time access code →
                </button>
              </div>
            )}
          </form>

          {/* RUO notice */}
          <div className="mt-6 pt-6 border-t border-white/6">
            <p className="font-mono text-[10px] text-white/20 tracking-wide text-center leading-relaxed">
              By creating an account you confirm you are 21+ and purchasing
              strictly for in vitro laboratory research purposes. Not for human
              or veterinary use.
            </p>
          </div>
        </div>

        <p className="text-center mt-6 font-body text-sm text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <Suspense>
        <AccountForm />
      </Suspense>
      <Footer />
    </>
  );
}
