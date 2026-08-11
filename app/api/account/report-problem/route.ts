import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";
import { wcAuthHeader } from "@/lib/wcAuth";
import { ISSUE_LABELS, SUPPORT_EMAIL, parsePhoto, sendReportEmail, addReportNote } from "@/lib/reportProblem";

interface WCOrder {
  id: number;
  number: string;
  customer_id: number;
}

export async function POST(req: NextRequest) {
  const customerId = await getAuthenticatedCustomerId(getBearerToken(req));
  if (!customerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: {
    orderId?: number;
    trackingNumber?: string;
    issueType?: string;
    description?: string;
    photoBase64?: string;
    photoFilename?: string;
    photoMimeType?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderId = Number(body.orderId);
  const trackingNumber = (body.trackingNumber ?? "").trim().slice(0, 100);
  const issueType = body.issueType ?? "";
  const description = (body.description ?? "").trim().slice(0, 2000);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Please select an order." }, { status: 400 });
  }
  if (!ISSUE_LABELS[issueType]) {
    return NextResponse.json({ error: "Please select a valid issue type." }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Please describe the issue." }, { status: 400 });
  }

  const { photo, error: photoError } = parsePhoto(body.photoBase64, body.photoFilename, body.photoMimeType);
  if (photoError) {
    return NextResponse.json({ error: photoError }, { status: 400 });
  }

  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const orderRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderId}`, {
    headers: { Authorization: auth },
  });
  if (!orderRes.ok) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const order = (await orderRes.json()) as WCOrder;
  if (order.customer_id !== customerId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const customerRes = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
    headers: { Authorization: auth },
  });
  const customer = customerRes.ok ? ((await customerRes.json()) as { email?: string }) : null;
  const customerEmail = customer?.email ?? "";

  const issueLabel = ISSUE_LABELS[issueType];

  const emailSent = await sendReportEmail({
    orderNumber: order.number,
    identityLine: `${customerEmail} (ID ${customerId})`,
    issueLabel,
    description,
    trackingNumber: trackingNumber || undefined,
    replyTo: customerEmail,
    photo,
  });

  if (!emailSent) {
    return NextResponse.json(
      { error: `Could not send your report. Please email ${SUPPORT_EMAIL} directly.` },
      { status: 502 }
    );
  }

  await addReportNote(wcUrl, auth, orderId, issueLabel, description, trackingNumber || undefined, !!photo);

  return NextResponse.json({ success: true });
}
