"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountDashboard from "@/components/AccountDashboard";
import GuestOrderLookup from "@/components/GuestOrderLookup";
import Link from "next/link";
import { Suspense } from "react";

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
  // REGISTRATION_FAILED deliberately falls through to `fallback` (the
  // server's actual message) instead of a canned "already exists" — that
  // used to mask the real WC rejection reason for every non-duplicate
  // registration failure, including a real phone-format bug.
  if (code === "AUTH_FAILED") {
    return "We couldn't verify those details. Check your email/phone and date of birth and try again.";
  }
  if (code === "VERIFY_FAILED") {
    return "Invalid or expired code. Please request a new one.";
  }
  return fallback;
}

// Auto-format birthday input as MM/DD/YYYY while typing
function formatBirthday(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

type TwoFactorStep = "idle" | "sending" | "enter_code" | "verifying";

// ─── Complete Profile — Google sign-in (or any account missing DOB) ───────────────
//
// Every provider funnels through this once: NextAuth's jwt callback
// (lib/authOptions.ts) flags needsCompletion=true for a brand-new Google
// customer, or an existing WC customer found by email with no
// anvil_birthday on file. Nothing is considered fully signed in (no WP JWT
// exists yet — see isAuthenticated in lib/authContext.tsx) until this runs,
// so the 21+/RUO gate applies identically regardless of how the customer
// arrived.
function CompleteProfileForm() {
  const { completeProfile, logout } = useAuth();
  const router = useRouter();
  const [birthday, setBirthday] = useState("");
  const [phone, setPhone] = useState("");
  const [researchAffiliationConfirmed, setResearchAffiliationConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass = "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!birthday || !researchAffiliationConfirmed) {
      setError("Date of birth and research affiliation confirmation are required.");
      return;
    }
    setSubmitting(true);
    try {
      await completeProfile(birthday, researchAffiliationConfirmed, phone.trim() || undefined);
      router.push("/account");
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setError(e2.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 pt-24">
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
      <div className="relative z-10 max-w-lg mx-auto px-6 py-16">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-px bg-blue-600" />
            <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">One Last Step</span>
            <div className="w-6 h-px bg-blue-600" />
          </div>
          <h1 className="font-display font-800 text-white text-3xl mb-2">Complete Your Profile</h1>
          <p className="font-body text-white/40 text-sm">
            Required to verify you&apos;re 21+ and purchasing for legitimate research purposes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          <div>
            <label className={labelClass}>Date of Birth *</label>
            <input
              type="text"
              required
              value={birthday}
              onChange={(e) => setBirthday(formatBirthday(e.target.value))}
              placeholder="MM / DD / YYYY"
              className={inputClass}
              maxLength={10}
              inputMode="numeric"
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className={inputClass}
            />
            <p className="font-mono text-[10px] text-white/25 tracking-wide mt-1.5">
              Lets you sign in with your phone number next time instead of Google.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={researchAffiliationConfirmed}
              onChange={(e) => setResearchAffiliationConfirmed(e.target.checked)}
              className="sr-only"
            />
            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${researchAffiliationConfirmed ? "bg-blue-600 border-blue-600" : "bg-white/5 border-white/15 group-hover:border-white/30"}`}>
              {researchAffiliationConfirmed && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="font-body text-sm text-white/55 leading-relaxed">
              I confirm I am 21+, affiliated with a research institution, and creating this
              account for a legitimate research purpose
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
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
          >
            {submitting ? "Saving..." : "Finish Setting Up →"}
          </button>
        </form>

        <p className="text-center mt-6 font-body text-sm text-white/30">
          <button type="button" onClick={() => logout()} className="hover:text-white/60 transition-colors">
            Sign out and use a different account
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleButton({ disabled }: { disabled?: boolean }) {
  const { loginWithGoogle } = useAuth();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => loginWithGoogle()}
      className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/15 hover:border-white/30 disabled:opacity-50 text-white font-display font-600 text-sm rounded-xl transition-all duration-300 bg-white/5 hover:bg-white/8"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1C3.26 21.3 7.3 24 12 24z" />
        <path fill="#FBBC05" d="M5.29 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3v-3.1H1.28A11.96 11.96 0 000 12c0 1.94.46 3.77 1.28 5.4l4.01-3.1z" />
        <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.28 6.6l4.01 3.1c.94-2.83 3.59-4.95 6.71-4.95z" />
      </svg>
      Continue with Google
    </button>
  );
}

function AccountForm() {
  const { login, loginWithCode, register, sendTwoFactor, isAuthenticated, hydrated, needsCompletion } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const claimOrder = searchParams.get("claimOrder");
  const claimKey = searchParams.get("claimKey");

  const [tab, setTab] = useState<"create" | "signin" | "lookup">(
    searchParams.get("tab") === "lookup" ? "lookup" : searchParams.get("tab") === "signin" ? "signin" : "create"
  );
  const [form, setForm] = useState({
    email: searchParams.get("prefillEmail") ?? "",
    phone: "",
    birthday: "",
    firstName: "",
    lastName: "",
  });
  // Sign-in only — either an email or a phone number, auto-detected server
  // and client-side by the presence of "@" (see isEmail in authContext.tsx).
  const [identifier, setIdentifier] = useState("");
  const [researchAffiliationConfirmed, setResearchAffiliationConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 2FA / one-time-code state
  const [twoFactorStep, setTwoFactorStep] = useState<TwoFactorStep>("idle");
  const [twoFactorIdentifier, setTwoFactorIdentifier] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Best-effort: link the guest order the customer just placed (identified by
  // claimOrder/claimKey, only ever present when CreateAccountNudge on the pay
  // page generated this link) to the account they just created/signed into.
  // Reads the WP JWT straight from a fresh getSession() call rather than the
  // useAuth() hook's reactive `user`, which may not have re-rendered with the
  // new session yet immediately after signIn() resolves. Never blocks
  // navigation — if this fails, the order is still findable via the guest
  // order-lookup tab.
  const attemptClaim = async () => {
    if (!claimOrder || !claimKey) return;
    try {
      const session = await getSession();
      const token = session?.user?.wpJwt;
      if (!token) return;
      await fetch(`/api/orders/${claimOrder}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderKey: claimKey }),
      });
    } catch {
      // Best-effort — see comment above.
    }
  };

  const handleBirthdayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    set("birthday", formatBirthday(e.target.value));
  }, []);

  // Arriving at /account with no specific continuation target (no redirect
  // param, or one pointing back at /account itself) means the visitor wants
  // their account dashboard, not to be bounced to the homepage — only a
  // redirect that names an actual destination (checkout, a gated product,
  // COAs) still auto-forwards once signed in.
  const wantsDashboard = redirect === "/" || redirect === "/account";

  useEffect(() => {
    if (hydrated && isAuthenticated && !wantsDashboard) router.replace(redirect);
  }, [hydrated, isAuthenticated, wantsDashboard, redirect, router]);

  // A signed-in-but-incomplete Google account (or any account missing DOB)
  // always lands here first, regardless of redirect target — the 21+/RUO
  // gate applies before anything else, same as every other provider.
  if (hydrated && needsCompletion) {
    return <CompleteProfileForm />;
  }

  if (hydrated && isAuthenticated && wantsDashboard) {
    return <AccountDashboard />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "create") {
      if (!form.email || !form.firstName || !form.lastName || !form.birthday || !researchAffiliationConfirmed) {
        setError("All required fields must be filled in.");
        return;
      }
    } else {
      if (!identifier || !form.birthday) {
        setError("Email/phone and date of birth are required.");
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
          researchAffiliationConfirmed,
          form.phone.trim() || undefined
        );
      } else {
        await login(identifier.trim(), form.birthday);
      }
      await attemptClaim();
      router.push(redirect);
    } catch (err: unknown) {
      const e2 = err as { code?: string; message?: string };
      setError(humanError(e2.code, e2.message ?? "Something went wrong. Please try again."));
      setSubmitting(false);
    }
  };

  const handleSendTwoFactor = async () => {
    setTwoFactorError("");
    if (!twoFactorIdentifier) {
      setTwoFactorError("Please enter your email address.");
      return;
    }
    // Phone one-time codes go through Twilio SMS, which is temporarily
    // disabled here while delivery is being fixed — email-only for now.
    if (!twoFactorIdentifier.includes("@")) {
      setTwoFactorError("One-time codes are available by email only right now. Please enter your email address.");
      return;
    }
    setTwoFactorStep("sending");
    try {
      await sendTwoFactor(twoFactorIdentifier.trim());
      setTwoFactorStep("enter_code");
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setTwoFactorError(e2.message ?? "Failed to send code. Please try again.");
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
      await loginWithCode(twoFactorIdentifier.trim(), twoFactorCode);
      await attemptClaim();
      router.push(redirect);
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setTwoFactorError(e2.message ?? "Invalid or expired code. Please try again.");
      setTwoFactorStep("enter_code");
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass =
    "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

  // ── 2FA / one-time-code panel ────────────────────────────────────────────
  if (twoFactorStep !== "idle" || twoFactorIdentifier !== "") {
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
                ? `Enter the 6-digit code sent to ${twoFactorIdentifier}`
                : "We'll email a one-time code to your registered email."}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-5">
            {!onCodeStep && (
              <>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={twoFactorIdentifier}
                    onChange={(e) => setTwoFactorIdentifier(e.target.value)}
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
              onClick={() => { setTwoFactorIdentifier(""); setTwoFactorStep("idle"); setTwoFactorCode(""); setTwoFactorError(""); }}
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
            {tab === "create" ? "Create Account" : tab === "signin" ? "Sign In" : "Find My Order"}
          </h1>
          <p className="font-body text-white/40 text-sm">
            {redirect === "/checkout"
              ? "Optional — guest checkout is available. Sign in to track this order automatically."
              : redirect.includes("access=lab-guide")
              ? "Sign in to view laboratory reconstitution reference data."
              : redirect.startsWith("/products/")
              ? "Log in to inquire about this compound."
              : redirect === "/coas"
              ? "Sign in to view this COA."
              : "Access your Anvil Compounds research account."}
          </p>

          {tab === "create" && (
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 font-mono text-[10px] text-blue-300 tracking-wide uppercase">
                No password · ~15 seconds
              </span>
            </div>
          )}
        </div>

        {/* Simple header tabs — underline style, matches the dashboard */}
        <div className="flex items-center justify-center gap-6 border-b border-white/10 mb-8">
          {(["create", "signin", "lookup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(""); }}
              className={`pb-3 -mb-px font-display font-600 text-sm border-b-2 transition-colors duration-200 ${
                tab === t
                  ? "border-blue-500 text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t === "create" ? "Create Account" : t === "signin" ? "Sign In" : "Find My Order"}
            </button>
          ))}
        </div>

        {tab === "lookup" ? (
          <GuestOrderLookup />
        ) : (
        <>
        {tab === "create" && (
          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center">
            <span className="font-body text-xs text-white/40">Track &amp; manage your orders</span>
            <span className="font-body text-xs text-white/40">Save your info for next time</span>
            <span className="font-body text-xs text-white/40">Hear about offers first</span>
          </div>
        )}

        <div className="mb-5">
          <GoogleButton disabled={submitting} />
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[10px] text-white/25 tracking-widest uppercase">or</span>
          <div className="h-px flex-1 bg-white/10" />
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

            {/* Create tab: separate required Email + optional Phone (WC
                customers need a real email regardless of how the customer
                prefers to log back in — see lib/wcAuth.ts). Sign-in tab: one
                "Email or Phone" identifier field, since returning customers
                just need to be found, not re-registered. */}
            {tab === "create" ? (
              <>
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
                <div>
                  <label className={labelClass}>Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="(555) 555-5555"
                    className={inputClass}
                  />
                  <p className="font-mono text-[10px] text-white/25 tracking-wide mt-1.5">
                    Optional — lets you sign in with your phone number instead of email next time.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className={labelClass}>Email or Phone *</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@institution.edu or (555) 555-5555"
                  className={inputClass}
                />
              </div>
            )}

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

            {/* Research affiliation — create tab only */}
            <AnimatePresence mode="wait">
              {tab === "create" && (
                <motion.div
                  key="research-affiliation"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={researchAffiliationConfirmed}
                      onChange={(e) => setResearchAffiliationConfirmed(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${researchAffiliationConfirmed ? "bg-blue-600 border-blue-600" : "bg-white/5 border-white/15 group-hover:border-white/30"}`}>
                      {researchAffiliationConfirmed && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className="font-body text-sm text-white/55 leading-relaxed">
                      I confirm I am affiliated with a research institution and am creating this
                      account for a legitimate research purpose
                    </p>
                  </label>
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

            {/* One-time access code — sign in tab only, a visible alternative
                to typing the birthday so it reads as a real option rather
                than a buried "forgot password" recovery link. */}
            {tab === "signin" && (
              <button
                type="button"
                onClick={() => { setTwoFactorIdentifier(identifier); setTwoFactorStep("idle"); }}
                className="w-full py-3 border border-white/15 hover:border-blue-400/40 text-white/60 hover:text-blue-300 font-display font-600 text-sm rounded-xl transition-all duration-300 bg-white/5 hover:bg-blue-600/5"
              >
                Log-in with one-time access code
              </button>
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
        </>
        )}

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
