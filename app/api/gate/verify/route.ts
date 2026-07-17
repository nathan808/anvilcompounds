import { NextRequest, NextResponse } from "next/server";
import { signGateToken, GATE_COOKIE_NAME } from "@/lib/gateAuth";
import { isValidResearchPurpose, OTHER_RESEARCH_PURPOSE } from "@/lib/researchPurpose";
import { isValidInstitutionType, OTHER_INSTITUTION_TYPE } from "@/lib/institutionType";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const {
    turnstileToken,
    ageConfirmed,
    ruoConfirmed,
    researchPurpose,
    researchPurposeOther,
    institutionType,
    institutionTypeOther,
  } = body ?? {};

  if (!ageConfirmed || !ruoConfirmed || !researchPurpose || !isValidResearchPurpose(researchPurpose)) {
    return NextResponse.json({ error: "All attestation fields are required." }, { status: 400 });
  }
  if (researchPurpose === OTHER_RESEARCH_PURPOSE && !researchPurposeOther?.trim()) {
    return NextResponse.json({ error: "Please describe your research purpose." }, { status: 400 });
  }
  if (!institutionType || !isValidInstitutionType(institutionType)) {
    return NextResponse.json({ error: "All attestation fields are required." }, { status: 400 });
  }
  if (institutionType === OTHER_INSTITUTION_TYPE && !institutionTypeOther?.trim()) {
    return NextResponse.json({ error: "Please describe your research institution." }, { status: 400 });
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

  const purposeDetail = researchPurpose === OTHER_RESEARCH_PURPOSE ? ` (${researchPurposeOther})` : "";
  const institutionDetail = institutionType === OTHER_INSTITUTION_TYPE ? ` (${institutionTypeOther})` : "";
  console.log(
    `[gate] verified ip=${ip} researchPurpose=${researchPurpose}${purposeDetail} institutionType=${institutionType}${institutionDetail} ts=${new Date().toISOString()}`
  );

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
