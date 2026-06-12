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

const VALID_PURPOSES = [
  "scientist",
  "research_associate",
  "lab_technician",
  "independent_researcher",
];

export async function POST(req: NextRequest) {
  try {
    const { email, birthday, firstName, lastName, researchPurpose } = await req.json();

    if (!email || !birthday || !firstName || !lastName || !researchPurpose) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "All fields are required." },
        { status: 400 }
      );
    }

    if (!VALID_PURPOSES.includes(researchPurpose)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Please select a valid research purpose." },
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
        meta_data: [
          { key: "anvil_birthday", value: birthday },
          { key: "anvil_research_purpose", value: researchPurpose },
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

    // Get JWT using derived password
    const jwtRes = await fetch(`${wcUrl}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    if (jwtRes.status === 404) {
      return NextResponse.json(
        {
          error: "AUTH_NOT_CONFIGURED",
          message:
            "Account login is being configured. Please contact support@anvilcompounds.shop.",
        },
        { status: 503 }
      );
    }

    if (!jwtRes.ok) {
      const jwtErr = (await jwtRes.json().catch(() => ({}))) as { message?: string };
      return NextResponse.json(
        {
          error: "AUTH_FAILED",
          message: jwtErr.message ?? "Account created but sign-in failed. Please try signing in.",
        },
        { status: 401 }
      );
    }

    const jwtData = (await jwtRes.json()) as { token: string };

    return NextResponse.json({
      token: jwtData.token,
      email,
      firstName,
      lastName,
      wcCustomerId,
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
