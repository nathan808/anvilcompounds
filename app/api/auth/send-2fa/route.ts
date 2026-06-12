import { NextRequest, NextResponse } from "next/server";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Email is required." },
        { status: 400 }
      );
    }

    const wcUrl = process.env.WC_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!wcUrl || !key || !secret) {
      return NextResponse.json(
        { error: "API_NOT_CONFIGURED", message: "Server configuration error." },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    const lookupRes = await fetch(
      `${wcUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    // Always return success to avoid email enumeration
    if (!lookupRes.ok) return NextResponse.json({ success: true });

    const customers = (await lookupRes.json()) as Array<{ id: number }>;
    if (!customers.length) return NextResponse.json({ success: true });

    const customerId = customers[0].id;
    const otp = generateOTP();
    const expiry = (Math.floor(Date.now() / 1000) + 600).toString(); // 10 min

    // Store OTP in WC customer meta
    await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        meta_data: [
          { key: "anvil_2fa_code", value: otp },
          { key: "anvil_2fa_expiry", value: expiry },
        ],
      }),
    });

    // Send via Resend (set RESEND_API_KEY env var in Vercel to enable)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Anvil Compounds <noreply@anvilcompounds.shop>",
          to: [email],
          subject: "Your Anvil Compounds Access Code",
          html: `
            <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#04091A;color:#fff;border-radius:16px;">
              <p style="color:#4D94F0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 8px;">Anvil Compounds</p>
              <h2 style="color:#fff;font-size:22px;margin:0 0 24px;">Your Access Code</h2>
              <div style="background:#0D1F3C;border:1px solid rgba(29,106,219,.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="font-size:38px;letter-spacing:.4em;color:#4D94F0;margin:0;font-weight:700;">${otp}</p>
              </div>
              <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 32px;">This code expires in 10 minutes. Do not share it with anyone.</p>
              <p style="color:rgba(255,255,255,.25);font-size:11px;margin:0;">If you did not request this, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send 2FA error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to send code. Please try again." },
      { status: 500 }
    );
  }
}
