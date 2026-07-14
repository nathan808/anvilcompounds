import { NextResponse } from "next/server";

// Temporary diagnostic endpoint — hit GET /api/bankful-ping to check Bankful connectivity.
// Remove this file once the gateway is confirmed working.
export async function GET() {
  const key      = process.env.BANKFUL_API_KEY;
  const secret   = process.env.BANKFUL_API_SECRET;
  const merchant = process.env.BANKFUL_MERCHANT_ID;

  if (!key || !secret || !merchant) {
    return NextResponse.json({
      ok: false,
      stage: "env",
      missing: {
        BANKFUL_API_KEY:      !key,
        BANKFUL_API_SECRET:   !secret,
        BANKFUL_MERCHANT_ID:  !merchant,
      },
    });
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  let bankfulStatus: number | null = null;
  let bankfulBody: unknown = null;

  try {
    const res = await fetch("https://api.paybybankful.com/api/invoice/create", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        email:            "ping@anvilcompounds.shop",
        request_currency: "USD",
        invoice_date:     new Date().toISOString().split("T")[0],
        reference_number: "PING-TEST",
        type_of_goods:    "shippable_goods",
        merchant_id:      parseInt(merchant, 10),
        invoiceItems: [{
          item_name:        "Ping Test",
          item_description: "Connectivity check — not a real order",
          quantity:         1,
          rate:             0.01,
          tax_percentage:   0,
        }],
        billingDetails: {
          first_name: "Ping",
          last_name:  "Test",
          email:      "ping@anvilcompounds.shop",
          address_1:  "123 Test St",
          city:       "Los Angeles",
          state:      "CA",
          zip:        "90001",
          country:    "US",
        },
      }),
    });

    bankfulStatus = res.status;
    bankfulBody   = await res.json();
  } catch (err) {
    return NextResponse.json({ ok: false, stage: "fetch", error: String(err) });
  }

  const success = (bankfulBody as { status?: string })?.status === "Success";

  return NextResponse.json({
    ok:            success,
    stage:         success ? "done" : "bankful-api",
    bankfulStatus,
    bankfulBody,
    merchantIdUsed: parseInt(merchant, 10),
  });
}
