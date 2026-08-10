import { NextRequest, NextResponse } from "next/server";
import { derivePassword, toE164 } from "@/lib/wcAuth";

export async function POST(req: NextRequest) {
  try {
    const { email, birthday, firstName, lastName, researchAffiliationConfirmed, phone } = await req.json();

    if (!email || !birthday || !firstName || !lastName || !researchAffiliationConfirmed) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "All fields are required." },
        { status: 400 }
      );
    }

    let e164Phone: string | null = null;
    if (phone) {
      e164Phone = toE164(phone);
      if (!e164Phone) {
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "Please enter a valid phone number, or leave it blank." },
          { status: 400 }
        );
      }
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
    const password = derivePassword(email, birthday);

    let wcCustomerId = 0;

    const createRes = await fetch(`${wcUrl}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        username: email,
        ...(e164Phone ? { billing: { phone: e164Phone } } : {}),
        meta_data: [
          { key: "anvil_birthday", value: birthday },
          { key: "anvil_research_affiliation_confirmed", value: "true" },
        ],
      }),
    });

    if (createRes.status === 401) {
      return NextResponse.json(
        {
          error: "API_READ_ONLY",
          message:
            "Account creation is temporarily unavailable. Please contact support@anvilcompounds.shop.",
        },
        { status: 503 }
      );
    }

    if (createRes.ok) {
      const newCustomer = (await createRes.json()) as { id: number };
      wcCustomerId = newCustomer.id;
    } else {
      const createErr = (await createRes.json().catch(() => ({}))) as { code?: string };
      const alreadyExists =
        createRes.status === 409 ||
        createErr.code === "registration-error-email-exists" ||
        createErr.code === "woocommerce_rest_customer_invalid_email";

      if (!alreadyExists) {
        return NextResponse.json(
          { error: "REGISTRATION_FAILED", message: "Failed to create account. Please try again." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "EMAIL_EXISTS",
          message: "An account with that email already exists. Please sign in.",
        },
        { status: 409 }
      );
    }

    // Account creation only — the client signs in immediately after via
    // NextAuth's "credentials-dob" provider (see lib/authOptions.ts), which
    // does the same derive-password → fetch-WP-JWT work this route used to
    // do inline, so it isn't duplicated in two places.
    return NextResponse.json({ success: true, email, wcCustomerId });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
