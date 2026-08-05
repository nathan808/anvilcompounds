import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";

// Links a guest order (customer_id: 0) to the customer account that was just
// created/signed into right after checkout — the mechanism behind the
// "create an account, we'll link this order" nudge on the pay page. Requires
// the order's order_key as proof of ownership (same pattern as
// lib/bankful.ts and app/api/checkout/order-status/route.ts), and only ever
// claims an order that's still unclaimed — never reassigns an order that
// already belongs to a different customer_id.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customerId = await getAuthenticatedCustomerId(getBearerToken(req));
  if (!customerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { orderKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const orderKey = (body.orderKey ?? "").trim();
  if (!orderKey) {
    return NextResponse.json({ error: "Missing order key" }, { status: 400 });
  }

  const wcUrl = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!wcUrl || !key || !secret) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }
  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");

  const orderRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${params.id}`, {
    headers: { Authorization: auth },
  });
  if (!orderRes.ok) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const order = (await orderRes.json()) as { order_key: string; customer_id: number };

  if (order.order_key !== orderKey) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.customer_id !== 0) {
    // Already claimed (by this or another account) — not an error the
    // customer needs to see; the order either already shows up for them
    // or belongs to someone else and never should.
    return NextResponse.json({ success: true, alreadyClaimed: true });
  }

  const patchRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${params.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ customer_id: customerId }),
  });
  if (!patchRes.ok) {
    return NextResponse.json({ error: "Could not link order" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
