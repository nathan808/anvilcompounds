"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Suspense } from "react";

function humanError(code: string | null | undefined, fallback: string): string {
  if (code === "AUTH_NOT_CONFIGURED") {
    return "Account login is being configured. Please contact support@anvilcompounds.shop to place an order.";
  }
  if (code === "API_READ_ONLY") {
    return "Account creation is temporarily unavailable. Please contact support@anvilcompounds.shop.";
  }
  return fallback;
}

function AccountForm() {
  const { login, register, isAuthenticated, hydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [tab, setTab] = useState<"create" | "signin">("create");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(redirect);
  }, [hydrated, isAuthenticated, redirect, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (tab === "create") {
      if (!form.email || !form.firstName || !form.lastName || !form.password) {
        setError("All fields are required.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    if (tab === "signin") {
      if (!form.email || !form.password) {
        setError("Email and password are required.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (tab === "create") {
        await register(
          form.email.toLowerCase().trim(),
          form.password,
          form.firstName.trim(),
          form.lastName.trim()
        );
      } else {
        await login(form.email.toLowerCase().trim(), form.password);
      }
      router.push(redirect);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(humanError(e.code, e.message ?? "Something went wrong. Please try again."));
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/8 rounded-xl text-white placeholder-white/20 font-body text-sm outline-none transition-all duration-300";
  const labelClass =
    "block font-mono text-xs text-white/40 tracking-widest uppercase mb-2";

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

            {/* Name fields — only on Create tab */}
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

            {/* Password */}
            <div>
              <label className={labelClass}>Password *</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 characters"
                className={inputClass}
              />
            </div>

            {/* Confirm password — only on Create tab */}
            <AnimatePresence mode="wait">
              {tab === "create" && (
                <motion.div
                  key="confirm-pw"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className={labelClass}>Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder="Repeat password"
                    className={inputClass}
                  />
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
                ? tab === "create"
                  ? "Creating Account..."
                  : "Signing In..."
                : tab === "create"
                ? "Create Account & Continue →"
                : "Sign In →"}
            </button>
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
