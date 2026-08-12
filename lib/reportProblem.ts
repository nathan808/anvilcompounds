// Shared by both report-problem routes — app/api/account/report-problem
// (authenticated, order picked from the customer's own orders) and
// app/api/orders/report-problem (guest, order number + billing email as the
// verification pair) — so the email/WC-note shape can't drift between the
// two entry points.

export const SUPPORT_EMAIL = "support@anvilcompounds.shop";
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB decoded — keeps the base64'd
// request body comfortably under Vercel's ~4.5MB serverless body limit.

export const ISSUE_LABELS: Record<string, string> = {
  wrong_item: "Wrong item received",
  lost_or_never_arrived: "Package lost or never arrived",
  order_status: "Where is my order · order status",
  add_item: "Add an item to my order",
  damaged: "Damaged arrival",
  coa_verification: "COA verification question",
  other: "Other",
};

// Reused at the end of every customer-facing transactional email — same
// compliance wording as the footnote on app/learn/page.tsx.
export const RUO_EMAIL_FOOTER =
  "Anvil Compounds products are intended solely for laboratory and investigational use. " +
  "We do not market, sell, or promote products for human or veterinary consumption, therapeutic use, " +
  "or clinical application. Must be 21+ to purchase.";

export interface ReportPhoto {
  base64: string;
  filename: string;
  mimeType: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Validates the raw request fields into a ReportPhoto, or an error message —
// shared so both routes enforce the exact same photo rules.
export function parsePhoto(
  photoBase64: string | undefined,
  photoFilename: string | undefined,
  photoMimeType: string | undefined
): { photo: ReportPhoto | null; error: string | null } {
  if (!photoBase64) return { photo: null, error: null };
  const mimeType = photoMimeType ?? "";
  if (!mimeType.startsWith("image/")) {
    return { photo: null, error: "Photo must be an image file." };
  }
  // Rough decoded-size check straight from the base64 string length,
  // without allocating a Buffer just to measure it.
  const decodedBytes = Math.floor((photoBase64.length * 3) / 4);
  if (decodedBytes > MAX_PHOTO_BYTES) {
    return { photo: null, error: "Photo must be under 4MB." };
  }
  return { photo: { base64: photoBase64, filename: (photoFilename ?? "photo").slice(0, 120), mimeType }, error: null };
}

// The "order context" block dropped into the support email — pulled
// straight from WC rather than trusted from the client, so it's accurate
// regardless of which route (guest or authenticated) is reporting.
export interface OrderContext {
  status: string;
  dateCreated: string;
  paymentMethod: string;
  lineItems: { name: string; quantity: number; total: string }[];
  shippingCity: string;
  shippingState: string;
  trackingNumber: string | null;
}

interface WCOrderForContext {
  status: string;
  date_created: string;
  payment_method: string;
  payment_method_title?: string;
  line_items: { name: string; quantity: number; total: string }[];
  shipping?: { city?: string; state?: string };
  meta_data: { key: string; value: string }[];
}

export function buildOrderContext(order: WCOrderForContext): OrderContext {
  return {
    status: order.status,
    dateCreated: order.date_created,
    paymentMethod: order.payment_method_title || order.payment_method,
    lineItems: order.line_items.map((li) => ({ name: li.name, quantity: li.quantity, total: li.total })),
    shippingCity: order.shipping?.city ?? "",
    shippingState: order.shipping?.state ?? "",
    trackingNumber: order.meta_data.find((m) => m.key === "tracking_number")?.value || null,
  };
}

function orderContextHtml(ctx: OrderContext): string {
  const shipTo = [ctx.shippingCity, ctx.shippingState].filter(Boolean).join(", ") || "—";
  const items = ctx.lineItems
    .map((li) => `<li>${li.quantity}&times; ${escapeHtml(li.name)} — $${escapeHtml(li.total)}</li>`)
    .join("");
  return `
    <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin:24px 0 8px;">Order Context</p>
    <table style="font-size:13px;color:#333;border-collapse:collapse;">
      <tr><td style="padding:2px 12px 2px 0;color:#888;">Status</td><td>${escapeHtml(ctx.status)}</td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#888;">Date</td><td>${escapeHtml(ctx.dateCreated)}</td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#888;">Payment</td><td>${escapeHtml(ctx.paymentMethod)}</td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#888;">Ship to</td><td>${escapeHtml(shipTo)}</td></tr>
      ${ctx.trackingNumber ? `<tr><td style="padding:2px 12px 2px 0;color:#888;">Tracking</td><td>${escapeHtml(ctx.trackingNumber)}</td></tr>` : ""}
    </table>
    <p style="font-size:13px;color:#333;margin:12px 0 4px;">Line items:</p>
    <ul style="font-size:13px;color:#333;margin:0;padding-left:18px;">${items}</ul>
  `;
}

export async function sendReportEmail(opts: {
  orderNumber: string;
  customerName: string;
  issueLabel: string;
  description: string;
  orderContext: OrderContext;
  replyTo?: string;
  photo: ReportPhoto | null;
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;
  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "Anvil Compounds Order Reports <noreply@anvilcompounds.shop>",
        to: [SUPPORT_EMAIL],
        reply_to: opts.replyTo || undefined,
        subject: `[${opts.issueLabel}] Order #${opts.orderNumber} — ${opts.customerName}`,
        html: `
          <div style="font-family:monospace;max-width:560px;margin:0 auto;padding:24px;">
            <p><strong>Order:</strong> #${escapeHtml(opts.orderNumber)}</p>
            <p><strong>Customer:</strong> ${escapeHtml(opts.customerName)}</p>
            <p><strong>Issue:</strong> ${escapeHtml(opts.issueLabel)}</p>
            <p style="white-space:pre-wrap;">${escapeHtml(opts.description)}</p>
            ${opts.photo ? "<p><em>Photo attached.</em></p>" : ""}
            ${orderContextHtml(opts.orderContext)}
          </div>
        `,
        attachments: opts.photo ? [{ filename: opts.photo.filename, content: opts.photo.base64 }] : undefined,
      }),
    });
    return emailRes.ok;
  } catch {
    return false;
  }
}

// Best-effort customer-facing acknowledgment — never blocks or fails the
// submission itself (the support email above is the actual delivery path;
// this is just a courtesy receipt), so failures are logged, not thrown.
export async function sendAckEmail(opts: {
  toEmail: string;
  firstName: string;
  orderNumber: string;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "Anvil Compounds Support <noreply@anvilcompounds.shop>",
        to: [opts.toEmail],
        subject: `We received your report — order #${opts.orderNumber}`,
        html: `
          <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#04091A;color:#fff;border-radius:16px;">
            <p style="color:#4D94F0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 8px;">Anvil Compounds</p>
            <h2 style="color:#fff;font-size:20px;margin:0 0 20px;">Report Received</h2>
            <p style="color:rgba(255,255,255,.75);font-size:14px;line-height:1.6;margin:0 0 24px;">
              Hi ${escapeHtml(opts.firstName || "there")}, we've received your report regarding order
              #${escapeHtml(opts.orderNumber)} and will respond within one business day (Mon–Fri).
              If anything changes with your order in the meantime, we'll reach out directly.
            </p>
            <p style="color:rgba(255,255,255,.35);font-size:11px;line-height:1.6;margin:0;">${RUO_EMAIL_FOOTER}</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      console.error(`[report-problem] ack email to ${opts.toEmail} failed: ${res.status}`);
    }
  } catch (err) {
    console.error(`[report-problem] ack email to ${opts.toEmail} threw:`, err);
  }
}

// Internal note (customer_note: false) so it doesn't re-surface to the
// customer as a shipment update (see shipmentUpdates filtering in
// app/api/account/orders/[id]/route.ts, which only shows customer_note:
// true notes) — documentation for Ken, not a customer-facing message.
// Best-effort: the email is the primary delivery path, so a note failure is
// logged but doesn't fail the customer's submission.
export async function addReportNote(
  wcUrl: string,
  auth: string,
  orderId: number,
  issueLabel: string,
  description: string
): Promise<void> {
  try {
    const noteRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        note: `Support ticket submitted: ${issueLabel} — ${description.slice(0, 200)}`,
        customer_note: false,
      }),
    });
    if (!noteRes.ok) {
      console.error(`[report-problem:${orderId}] failed to add WC order note: ${noteRes.status}`);
    }
  } catch (err) {
    console.error(`[report-problem:${orderId}] failed to add WC order note:`, err);
  }
}

// In-memory, best-effort rate limit — 3 submissions per email per hour.
// Serverless instances are ephemeral and there can be more than one running
// at once, so this isn't airtight, but it raises the bar against a script
// hammering the guest order-lookup endpoint without needing a Redis/KV
// dependency this project doesn't otherwise have.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const submissionTimestamps = new Map<string, number[]>();

export function checkRateLimit(email: string): boolean {
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const recent = (submissionTimestamps.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    submissionTimestamps.set(key, recent);
    return false;
  }
  recent.push(now);
  submissionTimestamps.set(key, recent);
  return true;
}
