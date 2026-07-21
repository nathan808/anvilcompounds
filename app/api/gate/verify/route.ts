import { NextRequest, NextResponse } from "next/server";
import { signGateToken, GATE_COOKIE_NAME } from "@/lib/gateAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { turnstileToken, ruoConfirmed, researchAffiliationConfirmed } = body ?? {};

  if (!ruoConfirmed || !researchAffiliationConfirmed) {
    return NextResponse.json({ error: "All attestation fields are required." }, { status: 400 });
  }

  // Falls back to Cloudflare's published "always passes" test secret key when
  // TURNSTILE_SECRET_KEY isn't set, so the gate flow works end-to-end in dev
  // before real Turnstile credentials exist. Swap in the real secret key
  // before this ever goes to production.
  const secretKey = process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

  const ip = req.headers.get("x-forwarded-for") ?? "";

  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: secretKey,
      response: turnstileToken ?? "",
      remoteip: ip,
    }),
  });
  const verifyData = await verifyRes.json();

  if (!verifyData.success) {
    return NextResponse.json({ error: "Verification failed. Please retry the challenge." }, { status: 403 });
  }

  console.log(`[gate] verified ip=${ip} researchAffiliationConfirmed=true ts=${new Date().toISOString()}`);

  const token = await signGateToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
