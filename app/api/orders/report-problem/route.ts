import { NextRequest, NextResponse } from "next/server";
import { wcAuthHeader } from "@/lib/wcAuth";
import {
  ISSUE_LABELS,
  SUPPORT_EMAIL,
  parsePhoto,
  sendReportEmail,
  sendAckEmail,
  addReportNote,
  buildOrderContext,
  checkRateLimit,
} from "@/lib/reportProblem";

// Guest report-a-problem — order number + billing email, no account
// required. Mirrors app/api/orders/lookup's guest-verification shape (order
// number + a second credential only the real customer would have): same
// generic error whether the order doesn't exist or the email doesn't match,
// so it can't be used to enumerate valid order numbers.
interface WCOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  payment_method: string;
  payment_method_title?: string;
  billing: { email?: string; first_name?: string; last_name?: string };
  shipping?: { city?: string; state?: string };
  line_items: { name: string; quantity: number; total: string }[];
  meta_data: { key: string; value: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOT_FOUND_MESSAGE = "We couldn't match that order — double-check the number and the email used at checkout.";

export async function POST(req: NextRequest) {
  let body: {
    orderNumber?: string;
    email?: string;
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

  const orderNumber = (body.orderNumber ?? "").trim().replace(/^#/, "");
  const email = (body.email ?? "").trim().toLowerCase();
  const issueType = body.issueType ?? "";
  const description = (body.description ?? "").trim().slice(0, 2000);

  if (!orderNumber || !/^\d+$/.test(orderNumber)) {
    // Same assumption relied on elsewhere (order `number` === numeric WC id).
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter the email you used at checkout." }, { status: 400 });
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

  // Rate limit before touching WC — this is the endpoint that lets an
  // anonymous caller probe order numbers against an email, so it's the one
  // that needs the guard, not the authenticated account route.
  if (!checkRateLimit(email)) {
    return NextResponse.json(
      { error: "Too many reports submitted. Please try again later or email support@anvilcompounds.shop directly." },
      { status: 429 }
    );
  }

  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const orderRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderNumber}`, {
    headers: { Authorization: auth },
  });
  if (!orderRes.ok) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }
  const order = (await orderRes.json()) as WCOrder;

  if ((order.billing.email ?? "").trim().toLowerCase() !== email) {
    // Same generic message whether the order doesn't exist or the email is
    // wrong — can't be used to enumerate valid order numbers.
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  const issueLabel = ISSUE_LABELS[issueType];
  const customerName = [order.billing.first_name, order.billing.last_name].filter(Boolean).join(" ") || "Guest";

  const emailSent = await sendReportEmail({
    orderNumber: order.number,
    customerName,
    issueLabel,
    description,
    orderContext: buildOrderContext(order),
    replyTo: email,
    photo,
  });

  if (!emailSent) {
    return NextResponse.json(
      { error: `Could not send your report. Please email ${SUPPORT_EMAIL} directly.` },
      { status: 502 }
    );
  }

  await addReportNote(wcUrl, auth, order.id, issueLabel, description);
  await sendAckEmail({ toEmail: email, firstName: order.billing.first_name ?? "", orderNumber: order.number });

  return NextResponse.json({ success: true });
}
