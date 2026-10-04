import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyGateToken, GATE_COOKIE_NAME } from "@/lib/gateAuth";

// COA and SDS files live in private/documents/ — outside public/, so Next
// never serves them statically. This handler is the only way to reach them,
// and it re-checks the gate cookie itself (middleware.ts already gates
// /documents/*; this is the second lock in case the matcher is ever edited).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROOT = path.join(process.cwd(), "private", "documents");

const CONTENT_TYPES: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
};

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Same preview-deployment bypass as middleware.ts (Turnstile never passes
  // on *.vercel.app previews); VERCEL_ENV is never "preview" in Production.
  if (process.env.VERCEL_ENV !== "preview") {
    const token = req.cookies.get(GATE_COOKIE_NAME)?.value;
    if (!(await verifyGateToken(token))) {
      const gateUrl = new URL("/gate", req.url);
      gateUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(gateUrl);
    }
  }

  const segments = params.path ?? [];
  if (segments.length === 0 || !segments.every((s) => SAFE_SEGMENT.test(s))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(ROOT, ...segments);
  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType || !filePath.startsWith(ROOT + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${segments[segments.length - 1]}"`,
        // Per-visitor content: never cache at the CDN or in shared caches.
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
