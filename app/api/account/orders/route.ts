import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";

export interface OrderSummary {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  dateCreated: string;
  itemSummary: string;
  itemCount: number;
  // See app/api/account/orders/[id]/route.ts for why these are unprefixed
  // `tracking_number`/`tracking_carrier` meta keys, not `_tracking_number`.
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
  line_items: { name: string; quantity: number }[];
  meta_data: { key: string; value: string }[];
}

export async function GET(req: NextRequest) {
  const customerId = await getAuthenticatedCustomerId(getBearerToken(req));
  if (!customerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const wcUrl = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!wcUrl || !key || !secret) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }
  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${wcUrl}/wp-json/wc/v3/orders?customer=${customerId}&per_page=50&orderby=date&order=desc`,
    { headers: { Authorization: auth }, next: { revalidate: 30 } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Could not load orders" }, { status: res.status });
  }

  const orders = (await res.json()) as WCOrder[];
  const summaries: OrderSummary[] = orders.map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    total: o.total,
    currency: o.currency ?? "USD",
    dateCreated: o.date_created,
    itemCount: o.line_items.reduce((n, li) => n + li.quantity, 0),
    itemSummary: o.line_items.map((li) => li.name).join(", "),
    trackingNumber: o.meta_data.find((m) => m.key === "tracking_number")?.value || null,
    trackingCarrier: o.meta_data.find((m) => m.key === "tracking_carrier")?.value || "USPS",
  }));

  return NextResponse.json(summaries);
}
