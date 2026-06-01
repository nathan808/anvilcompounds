import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Email and password are required." },
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

    // Step 1: Get JWT token from WordPress JWT Auth plugin
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
            "Account login is being configured. Please contact support@anvilcompounds.shop to place an order.",
        },
        { status: 503 }
      );
    }

    if (!jwtRes.ok) {
      const jwtErr = await jwtRes.json().catch(() => ({}));
      const msg =
        (jwtErr as { message?: string }).message ??
        "Invalid email or password.";
      return NextResponse.json(
        { error: "AUTH_FAILED", message: msg },
        { status: 401 }
      );
    }

    const jwtData = (await jwtRes.json()) as { token: string };
    const token = jwtData.token;

    // Step 2: Fetch WC customer record using admin key
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const customerRes = await fetch(
      `${wcUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    let firstName = "";
    let lastName = "";
    let wcCustomerId = 0;

    if (customerRes.ok) {
      const customers = (await customerRes.json()) as Array<{
        id: number;
        first_name: string;
        last_name: string;
      }>;
      if (customers.length > 0) {
        firstName = customers[0].first_name;
        lastName = customers[0].last_name;
        wcCustomerId = customers[0].id;
      }
    }

    return NextResponse.json({ token, email, firstName, lastName, wcCustomerId });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
