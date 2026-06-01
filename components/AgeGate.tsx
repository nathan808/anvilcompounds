"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AgeGate() {
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("anvil_age_verified");
    if (session) return;
    const stored = localStorage.getItem("anvil_age_verified");
    if (stored) {
      try {
        const { expires } = JSON.parse(stored);
        if (Date.now() < expires) return;
        localStorage.removeItem("anvil_age_verified");
      } catch {
        localStorage.removeItem("anvil_age_verified");
      }
    }
    setShow(true);
  }, []);

  const confirm = () => {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const record = JSON.stringify({ ts: Date.now(), expires: Date.now() + THIRTY_DAYS });
    if (remember) {
      localStorage.setItem("anvil_age_verified", record);
    } else {
      sessionStorage.setItem("anvil_age_verified", "1");
    }
    setShow(false);
  };

  const leave = () => {
    window.location.replace("https://www.google.com");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: "rgba(4,9,26,0.97)", backdropFilter: "blur(20px)" }}
        >
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(29,106,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.08) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md mx-6"
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Top accent bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent" />

              <div className="px-8 py-10 text-center">
                {/* Logo mark */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded bg-blue-600 rotate-45" />
                    <div className="absolute inset-[3px] rounded bg-navy-950 rotate-45" />
                    <div className="absolute inset-[6px] rounded bg-blue-600/80 rotate-45" />
                  </div>
                </div>

                {/* Label */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-blue-600/20" />
                  <span className="font-mono text-[10px] text-blue-400 tracking-[0.3em] uppercase">
                    Age Verification
                  </span>
                  <div className="flex-1 h-px bg-blue-600/20" />
                </div>

                {/* Heading */}
                <h2 className="font-display font-800 text-white text-2xl mb-1">
                  Research Use Only
                </h2>
                <p className="font-mono text-xs text-white/30 tracking-wider mb-8">
                  Acknowledgement required to enter
                </p>

                {/* Confirmations */}
                <div className="glass-card rounded-xl p-5 text-left space-y-3 mb-8">
                  {[
                    "You are at least 21 years of age",
                    "All products are sold strictly for in vitro laboratory and research purposes only — not for human or veterinary use",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      </div>
                      <p className="font-body text-sm text-white/55 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={confirm}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm tracking-wider rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30"
                  >
                    I CONFIRM — ENTER SITE
                  </button>
                  <button
                    onClick={leave}
                    className="w-full py-3 text-white/25 hover:text-white/50 font-mono text-xs tracking-[0.15em] uppercase transition-colors duration-200"
                  >
                    Leave Site
                  </button>
                </div>

                {/* Remember me */}
                <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                      remember
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white/5 border-white/15 group-hover:border-white/30"
                    }`}>
                      {remember && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-white/30 group-hover:text-white/50 transition-colors">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Bottom accent bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-600/30 to-transparent" />
            </div>

            {/* Fine print */}
            <p className="text-center font-mono text-[9px] text-white/15 tracking-wide mt-4 px-4 leading-relaxed">
              Anvil Compounds products are intended solely for laboratory and investigational use. Not for human or veterinary consumption, therapeutic use, or clinical application.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
