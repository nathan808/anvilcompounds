"use client";

import Link from "next/link";

interface Props {
  email?: string;
  // Only pass these when we hold a verified order_key for the order that was
  // just placed (currently: the pay page, right after place-order/route.ts's
  // redirect). When present, creating an account claims this specific order
  // via /api/orders/[id]/claim so it actually shows up in /account —
  // otherwise the copy below would be a promise the flow can't keep.
  orderId?: number;
  orderKey?: string;
}

export default function CreateAccountNudge({ email, orderId, orderKey }: Props) {
  const canClaim = !!(orderId && orderKey);

  const params = new URLSearchParams({ tab: "create", redirect: "/account" });
  if (email) params.set("prefillEmail", email);
  if (canClaim) {
    params.set("claimOrder", String(orderId));
    params.set("claimKey", orderKey!);
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="font-body text-sm text-white/70">
          {canClaim ? "Want to track this order?" : "Want to track future orders?"}
        </p>
        <p className="font-mono text-[11px] text-white/30 mt-0.5">
          {canClaim
            ? "No password, ~15 seconds — we'll link this order to your new account."
            : "No password, ~15 seconds — track orders and hear about offers first."}
        </p>
      </div>
      <Link
        href={`/account?${params.toString()}`}
        className="shrink-0 px-5 py-2.5 rounded-xl border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 font-display font-600 text-sm transition-all duration-300 hover:bg-blue-600/5"
      >
        Create Account →
      </Link>
    </div>
  );
}
