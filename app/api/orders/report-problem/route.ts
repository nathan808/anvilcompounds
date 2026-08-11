import { NextRequest, NextResponse } from "next/server";
import { wcAuthHeader } from "@/lib/wcAuth";
import { ISSUE_LABELS, SUPPORT_EMAIL, parsePhoto, sendReportEmail, addReportNote } from "@/lib/reportProblem";

// Guest report-a-problem — order number + tracking number, no account
// required. Mirrors app/api/orders/lookup's guest-verification shape (order
// number + a second credential only the real customer would have), swapping
// billing email for the order's tracking number.
//
// Trade-off, explicit by product decision: an order with no tracking_number
// meta set yet (not shipped, or Ken hasn't added one) can't be reported here
// — there's nothing to verify against. That's the accepted cost of not
// requiring an account or email lookup for this path.
interface WCOrder {
  id: number;
  number: string;
  meta_data: { key: string; value: string }[];
}

const NOT_FOUND_MESSAGE = "We couldn't find an order matching that order number and tracking number.";

export async function POST(req: NextRequest) {
  let body: {
    orderNumber?: string;
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

  const orderNumber = (body.orderNumber ?? "").trim().replace(/^#/, "");
  const trackingNumber = (body.trackingNumber ?? "").trim().slice(0, 100);
  const issueType = body.issueType ?? "";
  const description = (body.description ?? "").trim().slice(0, 2000);

  if (!orderNumber || !/^\d+$/.test(orderNumber)) {
    // Same assumption relied on elsewhere (order `number` === numeric WC id).
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }
  if (!trackingNumber) {
    return NextResponse.json({ error: "Please enter the tracking number from your order." }, { status: 400 });
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

  const orderRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderNumber}`, {
    headers: { Authorization: auth },
  });
  if (!orderRes.ok) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }
  const order = (await orderRes.json()) as WCOrder;

  const storedTracking = order.meta_data.find((m) => m.key === "tracking_number")?.value ?? "";
  if (!storedTracking || storedTracking.trim().toLowerCase() !== trackingNumber.toLowerCase()) {
    // Same generic message whether the order doesn't exist or the tracking
    // number is wrong — can't be used to enumerate valid order numbers.
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  const issueLabel = ISSUE_LABELS[issueType];

  const emailSent = await sendReportEmail({
    orderNumber: order.number,
    identityLine: "Guest report (verified via order number + tracking number)",
    issueLabel,
    description,
    trackingNumber,
    photo,
  });

  if (!emailSent) {
    return NextResponse.json(
      { error: `Could not send your report. Please email ${SUPPORT_EMAIL} directly.` },
      { status: 502 }
    );
  }

  await addReportNote(wcUrl, auth, order.id, issueLabel, description, trackingNumber, !!photo);

  return NextResponse.json({ success: true });
}
