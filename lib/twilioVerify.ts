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
  if (!auth || !serviceSid) return false;
  try {
    const res = await fetch(`${TWILIO_API}/Services/${serviceSid}/Verifications`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: e164Phone, Channel: "sms" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkPhoneOtp(e164Phone: string, code: string): Promise<boolean> {
  const auth = twilioAuthHeader();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!auth || !serviceSid) return false;
  try {
    const res = await fetch(`${TWILIO_API}/Services/${serviceSid}/VerificationCheck`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: e164Phone, Code: code }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "approved";
  } catch {
    return false;
  }
}
