import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";

export interface AccountOrderDetail {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  dateCreated: string;
  billingAddress: string;
  lineItems: { name: string; quantity: number; total: string }[];
  shipmentUpdates: { date: string; note: string }[];
  // Present only for orders still awaiting payment — lets the account page
  // link straight back into the existing pay page (/checkout/pay/[method])
  // to resume, rather than re-implementing any of that flow here.
  orderKey: string;
  paymentMethod: string;
  // Ken-entered tracking number, when present — see the `tracking_number`
  // meta-key comment below for how it actually gets set.
  trackingNumber: string | null;
}

interface WCOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  customer_id: number;
  order_key: string;
  payment_method: string;
  billing: {
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

// No shipment-tracking plugin/carrier API is installed on the WooCommerce
// backend. Two sources of shipment info, both manual on Ken's side:
//   - `tracking_number` order meta (no leading underscore, so it's NOT
//     WooCommerce/WordPress "protected" meta — it should appear in the
//     default WP admin "Custom Fields" box on the order screen without any
//     plugin). Surfaced as a distinct, labeled field.
//   - Customer-visible order notes (WC admin's "note to customer" when
//     marking an order shipped) — kept as the general shipment-updates feed.
// If Ken's WooCommerce is on newer HPOS order storage, the classic Custom
// Fields box may not apply the same way — worth confirming meta actually
// saves via this path before relying on it.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customerId = await getAuthenticatedCustomerId(getBearerToken(req));
  if (!customerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const orderRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${params.id}`, {
    headers: { Authorization: auth },
  });
  if (!orderRes.ok) {
    return NextResponse.json(
      { error: orderRes.status === 404 ? "Order not found" : "Could not load order" },
      { status: orderRes.status }
    );
  }
  const order = (await orderRes.json()) as WCOrder;

  if (order.customer_id !== customerId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let shipmentUpdates: { date: string; note: string }[] = [];
  try {
    const notesRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${params.id}/notes`, {
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
    // Shipment updates are a nice-to-have — an order still renders without them.
  }

  const detail: AccountOrderDetail = {
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
  };

  return NextResponse.json(detail);
}
