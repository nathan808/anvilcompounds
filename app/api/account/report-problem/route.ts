import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";

const SUPPORT_EMAIL = "support@anvilcompounds.shop";
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB decoded — keeps the base64'd
// request body comfortably under Vercel's ~4.5MB serverless body limit.

const ISSUE_LABELS: Record<string, string> = {
  wrong_item: "Wrong item received",
  didnt_arrive: "Order didn't arrive",
  damaged: "Item arrived damaged",
  other: "Other",
};

interface WCOrder {
  id: number;
  number: string;
  customer_id: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wcAuthHeader(): string | null {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

export async function POST(req: NextRequest) {
  const customerId = await getAuthenticatedCustomerId(getBearerToken(req));
  if (!customerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: {
    orderId?: number;
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

  let photo: { base64: string; filename: string; mimeType: string } | null = null;
  if (body.photoBase64) {
    const mimeType = body.photoMimeType ?? "";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Photo must be an image file." }, { status: 400 });
    }
    // Rough decoded-size check straight from the base64 string length,
    // without allocating a Buffer just to measure it.
    const decodedBytes = Math.floor((body.photoBase64.length * 3) / 4);
    if (decodedBytes > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Photo must be under 4MB." }, { status: 400 });
    }
    photo = {
      base64: body.photoBase64,
      filename: (body.photoFilename ?? "photo").slice(0, 120),
      mimeType,
    };
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

  const resendKey = process.env.RESEND_API_KEY;
  let emailSent = false;
  if (resendKey) {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "Anvil Compounds Order Reports <noreply@anvilcompounds.shop>",
        to: [SUPPORT_EMAIL],
        reply_to: customerEmail || undefined,
        subject: `Order #${order.number} issue: ${issueLabel}`,
        html: `
          <div style="font-family:monospace;max-width:560px;margin:0 auto;padding:24px;">
            <p><strong>Order:</strong> #${escapeHtml(order.number)}</p>
            <p><strong>Customer:</strong> ${escapeHtml(customerEmail)} (ID ${customerId})</p>
            <p><strong>Issue:</strong> ${escapeHtml(issueLabel)}</p>
            <p style="white-space:pre-wrap;">${escapeHtml(description)}</p>
            ${photo ? "<p><em>Photo attached.</em></p>" : ""}
          </div>
        `,
        attachments: photo ? [{ filename: photo.filename, content: photo.base64 }] : undefined,
      }),
    });
    emailSent = emailRes.ok;
  }

  if (!emailSent) {
    return NextResponse.json(
      { error: `Could not send your report. Please email ${SUPPORT_EMAIL} directly.` },
      { status: 502 }
    );
  }

  // Internal note (customer_note: false) so it doesn't re-surface to the
  // customer as a shipment update (see shipmentUpdates filtering in
  // app/api/account/orders/[id]/route.ts, which only shows customer_note:
  // true notes) — this note is documentation for Ken, not a customer-facing
  // message. Best-effort: the email above is the primary delivery path, so
  // a note failure is logged but doesn't fail the customer's submission.
  try {
    const noteRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        note: `Customer-reported issue (${issueLabel}): ${description}${photo ? " [photo attached to support email]" : ""}`,
        customer_note: false,
      }),
    });
    if (!noteRes.ok) {
      console.error(`[report-problem:${orderId}] failed to add WC order note: ${noteRes.status}`);
    }
  } catch (err) {
    console.error(`[report-problem:${orderId}] failed to add WC order note:`, err);
  }

  return NextResponse.json({ success: true });
}
