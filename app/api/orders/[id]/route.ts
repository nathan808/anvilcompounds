import { NextRequest, NextResponse } from "next/server";

export interface OrderDetail {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  lineItems: { name: string; quantity: number; total: string }[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const url    = process.env.WC_URL;
  const key    = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  if (!url || !key || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(`${url}/wp-json/wc/v3/orders/${params.id}`, {
    headers: { Authorization: `Basic ${auth}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: res.status === 404 ? "Order not found" : "Failed to fetch order" },
      { status: res.status }
    );
  }

  const o = await res.json() as {
    id: number;
    number: string;
    status: string;
    total: string;
    currency: string;
    billing: { email: string; first_name: string; last_name: string };
    line_items: { name: string; quantity: number; total: string }[];
  };

  const detail: OrderDetail = {
    id:         o.id,
    number:     o.number,
    status:     o.status,
    total:      o.total,
    currency:   o.currency ?? "USD",
    email:      o.billing.email,
    firstName:  o.billing.first_name,
    lastName:   o.billing.last_name,
    lineItems:  o.line_items.map((li) => ({
      name:     li.name,
      quantity: li.quantity,
      total:    li.total,
    })),
  };

  return NextResponse.json(detail);
}
