// Thin wrapper over Twilio's Verify REST API (raw fetch, no SDK — same
// "call the provider's HTTP API directly" pattern this app already uses for
// Resend). Verify owns OTP generation/expiry/rate-limiting server-side, so
// unlike the email 2FA flow (app/api/auth/send-2fa) there's no code to
// store in WC customer meta for the phone path.

const TWILIO_API = "https://verify.twilio.com/v2";

function twilioAuthHeader(): string | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

export async function sendPhoneOtp(e164Phone: string): Promise<boolean> {
  const auth = twilioAuthHeader();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!auth || !serviceSid) {
    console.error("[twilioVerify.send] missing TWILIO_ACCOUNT_SID/AUTH_TOKEN/VERIFY_SERVICE_SID env vars");
    return false;
  }
  try {
    const res = await fetch(`${TWILIO_API}/Services/${serviceSid}/Verifications`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: e164Phone, Channel: "sms" }),
    });
    if (!res.ok) {
      // The client response always says {success:true} regardless (see
      // app/api/auth/send-phone-otp/route.ts — same anti-enumeration shape
      // as the email 2FA route), so this is the only place the real Twilio
      // rejection reason (bad number, unverified trial number, Verify
      // Service misconfigured, etc.) is visible at all.
      const body = await res.text();
      console.error(`[twilioVerify.send] Twilio rejected the request (${res.status}):`, body);
    }
    return res.ok;
  } catch (err) {
    console.error("[twilioVerify.send] network/fetch error:", err);
    return false;
  }
}

export async function checkPhoneOtp(e164Phone: string, code: string): Promise<boolean> {
  const auth = twilioAuthHeader();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!auth || !serviceSid) {
    console.error("[twilioVerify.check] missing TWILIO_ACCOUNT_SID/AUTH_TOKEN/VERIFY_SERVICE_SID env vars");
    return false;
  }
  try {
    const res = await fetch(`${TWILIO_API}/Services/${serviceSid}/VerificationCheck`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: e164Phone, Code: code }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[twilioVerify.check] Twilio rejected the request (${res.status}):`, body);
      return false;
    }
    const data = (await res.json()) as { status?: string };
    return data.status === "approved";
  } catch (err) {
    console.error("[twilioVerify.check] network/fetch error:", err);
    return false;
  }
}
