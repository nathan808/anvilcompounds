// Shared by both report-problem routes — app/api/account/report-problem
// (authenticated, order picked from the customer's own orders) and
// app/api/orders/report-problem (guest, order number + tracking number as
// the verification pair) — so the email/WC-note shape can't drift between
// the two entry points.

export const SUPPORT_EMAIL = "support@anvilcompounds.shop";
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB decoded — keeps the base64'd
// request body comfortably under Vercel's ~4.5MB serverless body limit.

export const ISSUE_LABELS: Record<string, string> = {
  wrong_item: "Wrong item received",
  didnt_arrive: "Where is my order / order status",
  coa_verification: "COA verification question",
  damaged: "Damaged arrival",
  other: "Other",
};

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

export async function sendReportEmail(opts: {
  orderNumber: string;
  identityLine: string;
  issueLabel: string;
  description: string;
  trackingNumber?: string;
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
        subject: `Order #${opts.orderNumber} issue: ${opts.issueLabel}`,
        html: `
          <div style="font-family:monospace;max-width:560px;margin:0 auto;padding:24px;">
            <p><strong>Order:</strong> #${escapeHtml(opts.orderNumber)}</p>
            <p><strong>From:</strong> ${escapeHtml(opts.identityLine)}</p>
            <p><strong>Issue:</strong> ${escapeHtml(opts.issueLabel)}</p>
            ${opts.trackingNumber ? `<p><strong>Tracking number given:</strong> ${escapeHtml(opts.trackingNumber)}</p>` : ""}
            <p style="white-space:pre-wrap;">${escapeHtml(opts.description)}</p>
            ${opts.photo ? "<p><em>Photo attached.</em></p>" : ""}
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
  description: string,
  trackingNumber: string | undefined,
  hasPhoto: boolean
): Promise<void> {
  try {
    const noteRes = await fetch(`${wcUrl}/wp-json/wc/v3/orders/${orderId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        note: `Customer-reported issue (${issueLabel}): ${description}${trackingNumber ? ` [tracking given: ${trackingNumber}]` : ""}${hasPhoto ? " [photo attached to support email]" : ""}`,
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
