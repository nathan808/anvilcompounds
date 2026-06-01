import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "All fields are required." },
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

    // Step 1: Create WC customer
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
      // 409 or similar — customer already exists, try to proceed to login
      const createErr = (await createRes.json().catch(() => ({}))) as {
        code?: string;
      };
      const alreadyExists =
        createRes.status === 409 ||
        createErr.code === "registration-error-email-exists" ||
        createErr.code === "woocommerce_rest_customer_invalid_email";

      if (!alreadyExists) {
        return NextResponse.json(
          {
            error: "REGISTRATION_FAILED",
            message: "Failed to create account. Please try again.",
          },
          { status: 400 }
        );
      }

      // Fetch the existing customer's ID
      const lookupRes = await fetch(
        `${wcUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Basic ${auth}` } }
      );
      if (lookupRes.ok) {
        const customers = (await lookupRes.json()) as Array<{ id: number }>;
        if (customers.length > 0) wcCustomerId = customers[0].id;
      }
    }

    // Step 2: Get JWT token
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
      const jwtErr = (await jwtRes.json().catch(() => ({}))) as {
        message?: string;
      };
      return NextResponse.json(
        {
          error: "AUTH_FAILED",
          message: jwtErr.message ?? "Account created but login failed. Please sign in.",
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
