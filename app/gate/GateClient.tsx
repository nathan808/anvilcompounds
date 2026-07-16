"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void }
      ) => string;
    };
  }
}

const RESEARCHER_TYPES = ["Private Research", "Laboratory", "Academic"] as const;

export default function GateClient() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/catalog";

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [ruoConfirmed, setRuoConfirmed] = useState(false);
  const [researcherType, setResearcherType] = useState<(typeof RESEARCHER_TYPES)[number] | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (!scriptLoaded || rendered.current || !widgetRef.current || !window.turnstile) return;
    rendered.current = true;
    window.turnstile.render(widgetRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
    });
  }, [scriptLoaded]);

  const canSubmit = ageConfirmed && ruoConfirmed && !!researcherType && !!turnstileToken && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/gate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken, ageConfirmed, ruoConfirmed, researcherType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Verification failed. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = redirect;
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={() => setScriptLoaded(true)}
      />
      <div className="min-h-screen bg-navy-950 flex items-center justify-center px-6 py-16">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(29,106,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative w-full max-w-md">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent" />

            <div className="px-8 py-10">
              <div className="flex justify-center mb-6">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded bg-blue-600 rotate-45" />
                  <div className="absolute inset-[3px] rounded bg-navy-950 rotate-45" />
                  <div className="absolute inset-[6px] rounded bg-blue-600/80 rotate-45" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex-1 h-px bg-blue-600/20" />
                <span className="font-mono text-[10px] text-blue-400 tracking-[0.3em] uppercase">
                  Research Access
                </span>
                <div className="flex-1 h-px bg-blue-600/20" />
              </div>

              <h1 className="font-display font-800 text-white text-2xl mb-1 text-center">
                Verification Required
              </h1>
              <p className="font-mono text-xs text-white/30 tracking-wider mb-8 text-center">
                Confirm below to continue
              </p>

              {/* Attestations */}
              <div className="glass-card rounded-xl p-5 text-left space-y-3 mb-5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${ageConfirmed ? "bg-blue-600 border-blue-600" : "bg-white/5 border-white/15 group-hover:border-white/30"}`}>
                    {ageConfirmed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="font-body text-sm text-white/55 leading-relaxed">
                    I am at least 21 years of age
                  </p>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ruoConfirmed}
                    onChange={(e) => setRuoConfirmed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${ruoConfirmed ? "bg-blue-600 border-blue-600" : "bg-white/5 border-white/15 group-hover:border-white/30"}`}>
                    {ruoConfirmed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="font-body text-sm text-white/55 leading-relaxed">
                    I understand these products are for laboratory research use only and not for human or veterinary consumption
                  </p>
                </label>
              </div>

              {/* Researcher type */}
              <div className="mb-5">
                <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase mb-2.5">
                  I am inquiring as
                </p>
                <div className="flex flex-wrap gap-2">
                  {RESEARCHER_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setResearcherType(type)}
                      className={`px-3.5 py-2 rounded-lg border font-mono text-xs transition-all duration-200 ${
                        researcherType === type
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/75"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turnstile widget */}
              <div ref={widgetRef} className="flex justify-center mb-5" />

              {error && (
                <p className="font-mono text-xs text-red-400 text-center mb-4">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/25 disabled:cursor-not-allowed text-white font-display font-700 text-sm tracking-wider rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
              >
                {submitting ? "Verifying…" : "Continue"}
              </button>
            </div>

            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-600/30 to-transparent" />
          </div>

          <p className="text-center font-mono text-[9px] text-white/15 tracking-wide mt-4 px-4 leading-relaxed">
            Anvil Compounds products are intended solely for laboratory and investigational use. Not for
            human or veterinary consumption, therapeutic use, or clinical application.
          </p>
        </div>
      </div>
    </>
  );
}
