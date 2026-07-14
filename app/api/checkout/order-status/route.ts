import { NextRequest, NextResponse } from "next/server";
import { ORDER_HOLD_DAYS } from "@/lib/paymentConfig";

// Deliberately minimal: no line items, no product names, no billing name —
// the pay/confirmation pages only ever need order number/total/status/hold
// expiry and (for the confirmation page) which payment method was used.
//
// `key` (the order's WC order_key) is optional here:
//   - Supplied (pay page, always reached via place-order's own redirect):
//     enforced as an ownership check — a mismatch returns 404, same as a
//     genuinely missing order, so a wrong key can't be distinguished from
//     "doesn't exist."
//   - Omitted (confirmation page): Bankful's own x_url_complete has no key
//     param (per the contract), so this page can only look up by order id.
//     That's a minor, accepted information-disclosure tradeoff inherent to
//     that URL's shape — anyone who knows/guesses an order id can see its
//     status/total from this endpoint. Flagged, not silently fixed, since
//     tightening it would require changing x_url_complete itself.
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order");
  const key = req.nextUrl.searchParams.get("key");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order" }, { status: 400 });
  }

  const url = process.env.WC_URL;
  const wcKey = process.env.WC_CONSUMER_KEY;
  const wcSecret = process.env.WC_CONSUMER_SECRET;
  if (!url || !wcKey || !wcSecret) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const auth = Buffer.from(`${wcKey}:${wcSecret}`).toString("base64");
  const res = await fetch(`${url}/wp-json/wc/v3/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = (await res.json()) as {
    id: number;
    number: string;
    order_key: string;
    status: string;
    total: string;
    date_created: string;
    payment_method: string;
  };

  if (key && order.order_key !== key) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const createdAt = new Date(order.date_created);
  const holdExpiryDate = new Date(createdAt.getTime() + ORDER_HOLD_DAYS * 24 * 60 * 60 * 1000);

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.number,
    status: order.status,
    total: order.total,
    paymentMethod: order.payment_method,
    holdExpiryDate: holdExpiryDate.toISOString(),
  });
}
