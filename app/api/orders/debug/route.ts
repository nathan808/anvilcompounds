import { NextResponse } from "next/server";

// GET /api/orders/debug — tests WC connection and env vars without placing an order
// Remove this file before final production deploy
export async function GET() {
  const url    = process.env.WC_URL;
  const key    = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  const envCheck = {
    WC_URL:             url    ? `"${url}"` : "❌ MISSING",
    WC_CONSUMER_KEY:    key    ? `ck_...${key.slice(-6)}`    : "❌ MISSING",
    WC_CONSUMER_SECRET: secret ? `cs_...${secret.slice(-6)}` : "❌ MISSING",
  };

  if (!url || !key || !secret) {
    return NextResponse.json({ env: envCheck, wcTest: "skipped — env vars missing" }, { status: 500 });
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  // Test GET /products
  let wcGetStatus: number | string = "not attempted";
  let wcGetBody: unknown = null;
  try {
    const res = await fetch(`${url}/wp-json/wc/v3/products?per_page=1`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    wcGetStatus = res.status;
    wcGetBody   = await res.json();
  } catch (err) {
    wcGetStatus = "network error";
    wcGetBody   = String(err);
  }

  // Test POST /orders with a minimal dry-run payload
  let wcPostStatus: number | string = "not attempted";
  let wcPostBody: unknown = null;
  try {
    const res = await fetch(`${url}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        payment_method: "bacs",
        payment_method_title: "Test",
        status: "pending",
        billing: {
          first_name: "Debug", last_name: "Test",
          address_1: "123 Test St", city: "Los Angeles",
          state: "CA", postcode: "90001", country: "US",
          email: "debug@anvilcompounds.shop", phone: "5550000000",
        },
        shipping: {
          first_name: "Debug", last_name: "Test",
          address_1: "123 Test St", city: "Los Angeles",
          state: "CA", postcode: "90001", country: "US",
        },
        line_items: [{ product_id: 332, quantity: 1 }],
      }),
    });
    wcPostStatus = res.status;
    const body = await res.json() as { id?: number; number?: string; code?: string; message?: string };
    wcPostBody = { id: body.id, number: body.number, code: body.code, message: body.message };
  } catch (err) {
    wcPostStatus = "network error";
    wcPostBody   = String(err);
  }

  return NextResponse.json({
    env: envCheck,
    wcGetProducts: { status: wcGetStatus, firstProductName: (wcGetBody as {name?:string}[])?.[0]?.name ?? wcGetBody },
    wcPostOrder:   { status: wcPostStatus, result: wcPostBody },
  });
}
