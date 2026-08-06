import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORT_EMAIL = "support@anvilcompounds.shop";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Sends the contact form to support@ via Resend (same provider/pattern as
// the 2FA email in app/api/auth/send-2fa/route.ts). Unlike that route, there
// is no fallback path if RESEND_API_KEY is unset — a 2FA code still gets
// stored even without email, but a contact message has nowhere else to go,
// so an unconfigured key is reported as a real error rather than a silent
// "success" that actually loses the message.
export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 100);
  const email = (body.email ?? "").trim().slice(0, 254);
  const message = (body.message ?? "").trim().slice(0, 4000);

  if (!name || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json({ error: "Please fill in your name, a valid email, and a message." }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: `Contact form is temporarily unavailable. Please email ${SUPPORT_EMAIL} directly.` },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Anvil Compounds Contact Form <noreply@anvilcompounds.shop>",
        to: [SUPPORT_EMAIL],
        reply_to: email,
        subject: `Contact form: ${name}`,
        html: `
          <div style="font-family:monospace;max-width:560px;margin:0 auto;padding:24px;">
            <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
            <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not send your message. Please email ${SUPPORT_EMAIL} directly.` },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: `Could not send your message. Please email ${SUPPORT_EMAIL} directly.` },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
