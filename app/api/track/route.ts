import { NextRequest, NextResponse } from "next/server";

const OMNISEND_API = "https://api.omnisend.com/v3";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event: string;
      email?: string;
      payload?: Record<string, unknown>;
    };

    const apiKey = process.env.OMNISEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, reason: "no_api_key" });
    }

    const headers = {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    };

    // systemName must be top-level (lowercase, hyphenated), not inside fields
    const systemName = body.event.toLowerCase().replace(/\s+/g, "-");

    await fetch(`${OMNISEND_API}/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: body.email ?? "",
        eventName: body.event,
        eventVersion: "v2",
        systemName,
        fields: body.payload ?? {},
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never surface tracking errors to the client
    return NextResponse.json({ ok: false });
  }
}
