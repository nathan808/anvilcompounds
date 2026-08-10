import { NextRequest, NextResponse } from "next/server";
import { findWcCustomerByPhone, toE164 } from "@/lib/wcAuth";
import { sendPhoneOtp } from "@/lib/twilioVerify";

// Phone equivalent of app/api/auth/send-2fa — sends via Twilio Verify
// instead of emailing a stored code. Same anti-enumeration shape: always
// returns { success: true } regardless of whether the phone is registered.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { phone?: string } | null;
  const e164 = body?.phone ? toE164(body.phone) : null;

  if (!e164) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const customer = await findWcCustomerByPhone(e164);
  if (customer) {
    await sendPhoneOtp(e164);
  }

  return NextResponse.json({ success: true });
}
