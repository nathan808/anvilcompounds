import { NextRequest, NextResponse } from "next/server";

// Guest order lookup — order number + billing email, no account/JWT required.
// Mirrors the same "honest shipment updates" approach as
// app/api/account/orders/[id]/route.ts: no carrier-tracking integration
// exists, so fulfillment progress comes from customer-facing WC order notes.
//
// Unlike the older, unauthenticated app/api/orders/[id]/route.ts (which
// returns full order details given only a guessable numeric ID — a known,
// flagged gap, left alone since it backs a separate legacy page), this route
// requires the billing email to match before returning anything, and returns
// the same generic error whether the order doesn't exist or the email is
// wrong, so it can't be used to enumerate order numbers.
export interface GuestOrderDetail {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  dateCreated: string;
  billingAddress: string;
  lineItems: { name: string; quantity: number; total: string }[];
  shipmentUpdates: { date: string; note: string }[];
  orderKey: string;
  paymentMethod: string;
  trackingNumber: string | null;
  trackingCarrier: string;
}

interface WCOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  order_key: string;
  payment_method: string;
  billing: {
    email?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
  line_items: { name: string; quantity: number; total: string }[];
  meta_data: { key: string; value: string }[];
}

interface WCOrderNote {
  date_created: string;
  note: string;
  customer_note: boolean;
}

function wcAuthHeader(): string | null {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

const NOT_FOUND_MESSAGE = "We couldn't find an order matching that order number and email.";

export async function POST(req: NextRequest) {
  let body: { orderNumber?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderNumber = (body.orderNumber ?? "").trim().replace(/^#/, "");
  const email = (body.email ?? "").trim().toLowerCase();
  if (!orderNumber || !email) {
    return NextResponse.json({ error: "Order number and email are required." }, { status: 400 });
  }
  if (!/^\d+$/.test(orderNumber)) {
    // This store's order `number` is the same as its numeric WC id (no custom
    // order-numbering plugin) — same assumption already relied on elsewhere
    // (e.g. place-order/route.ts's response, PayPageClient's ?order= param).
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const orderRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderNumber}`, {
    headers: { Authorization: auth },
  });
  if (!orderRes.ok) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }
  const order = (await orderRes.json()) as WCOrder;

  if ((order.billing.email ?? "").trim().toLowerCase() !== email) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  let shipmentUpdates: { date: string; note: string }[] = [];
  try {
    const notesRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderNumber}/notes`, {
      headers: { Authorization: auth },
    });
    if (notesRes.ok) {
      const notes = (await notesRes.json()) as WCOrderNote[];
      shipmentUpdates = notes
        .filter((n) => n.customer_note)
        .map((n) => ({ date: n.date_created, note: n.note }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  } catch {
    // Shipment updates are a nice-to-have — the order still renders without them.
  }

  const detail: GuestOrderDetail = {
    id: order.id,
    number: order.number,
    status: order.status,
    total: order.total,
    currency: order.currency ?? "USD",
    dateCreated: order.date_created,
    billingAddress: [order.billing.address_1, order.billing.address_2, order.billing.city, order.billing.state, order.billing.postcode]
      .filter(Boolean)
      .join(", "),
    lineItems: order.line_items.map((li) => ({ name: li.name, quantity: li.quantity, total: li.total })),
    shipmentUpdates,
    orderKey: order.order_key,
    paymentMethod: order.payment_method,
    trackingNumber: order.meta_data.find((m) => m.key === "tracking_number")?.value || null,
    trackingCarrier: order.meta_data.find((m) => m.key === "tracking_carrier")?.value || "USPS",
  };

  return NextResponse.json(detail);
}
