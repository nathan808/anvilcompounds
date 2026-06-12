import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function derivePassword(email: string, birthday: string): string {
  const secret = process.env.ANVIL_AUTH_SECRET ?? "anvil_research_2024";
  return crypto
    .createHmac("sha256", secret)
    .update(`${email.toLowerCase().trim()}:${birthday}`)
    .digest("hex")
    .slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Email and code are required." },
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

    if (!lookupRes.ok) {
      return NextResponse.json(
        { error: "AUTH_FAILED", message: "Invalid or expired code." },
        { status: 401 }
      );
    }

    const customers = (await lookupRes.json()) as Array<{
      id: number;
      first_name: string;
      last_name: string;
      meta_data: Array<{ key: string; value: string }>;
    }>;

    if (!customers.length) {
      return NextResponse.json(
        { error: "AUTH_FAILED", message: "Invalid or expired code." },
        { status: 401 }
      );
    }

    const customer = customers[0];
    const getMeta = (k: string) => customer.meta_data.find((m) => m.key === k)?.value ?? "";

    const storedCode = getMeta("anvil_2fa_code");
    const storedExpiry = getMeta("anvil_2fa_expiry");
    const storedBirthday = getMeta("anvil_birthday");

    if (!storedCode || storedCode !== code.trim()) {
      return NextResponse.json(
        { error: "AUTH_FAILED", message: "Invalid or expired code." },
        { status: 401 }
      );
    }

    if (storedExpiry && Math.floor(Date.now() / 1000) > parseInt(storedExpiry)) {
      return NextResponse.json(
        { error: "CODE_EXPIRED", message: "Code has expired. Please request a new one." },
        { status: 401 }
      );
    }

    if (!storedBirthday) {
      return NextResponse.json(
        { error: "AUTH_FAILED", message: "Account setup incomplete. Contact support@anvilcompounds.shop." },
        { status: 401 }
      );
    }

    // Clear OTP
    await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        meta_data: [
          { key: "anvil_2fa_code", value: "" },
          { key: "anvil_2fa_expiry", value: "" },
        ],
      }),
    });

    // Get JWT using derived internal password
    const password = derivePassword(email, storedBirthday);

    const jwtRes = await fetch(`${wcUrl}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    if (!jwtRes.ok) {
      return NextResponse.json(
        { error: "AUTH_FAILED", message: "Verification failed. Contact support@anvilcompounds.shop." },
        { status: 401 }
      );
    }

    const jwtData = (await jwtRes.json()) as { token: string };

    return NextResponse.json({
      token: jwtData.token,
      email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      wcCustomerId: customer.id,
    });
  } catch (err) {
    console.error("Verify 2FA error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
