import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyGateToken, GATE_COOKIE_NAME } from "@/lib/gateAuth";
import GateClient from "./GateClient";

export const metadata = {
  title: "Verification Required — Anvil Compounds",
  robots: { index: false, follow: false },
};

// Visitors reach /gate both when middleware.ts redirects an unverified
// request AND via direct links (e.g. the homepage catalog preview cards)
// that always point here regardless of verification state. Checking the
// existing signed cookie here -- the same one middleware checks -- means an
// already-verified visitor is bounced straight through instead of having to
// re-clear Turnstile/attestation every time they click a compound.
export default async function GatePage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const token = cookies().get(GATE_COOKIE_NAME)?.value;
  if (await verifyGateToken(token)) {
    redirect(searchParams.redirect || "/catalog");
  }

  return (
    <Suspense fallback={null}>
      <GateClient />
    </Suspense>
  );
}
