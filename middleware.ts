import { NextRequest, NextResponse } from "next/server";
import { verifyGateToken, GATE_COOKIE_NAME } from "@/lib/gateAuth";

// Gates the routes that actually expose product names/prices — catalog,
// product pages, COAs (/coas, /documents files and WP-uploaded COA files),
// checkout — behind Turnstile + attestation (see
// app/gate). Marketing pages (home hero, testing process, FAQ, blog, about)
// are deliberately left out so they stay indexable; only the routes a
// payment-processor crawler would flag sit behind this.
export const config = {
  matcher: [
    "/catalog/:path*",
    "/products/:path*",
    "/coas/:path*",
    "/documents/:path*",
    "/wp-content/uploads/:path*",
    "/checkout/:path*",
    "/api/products/:path*",
    "/api/checkout/:path*",
  ],
};

// COA files uploaded through WordPress (e.g. /wp-content/uploads/2026/06/TB500COA.pdf)
// are proxied from Hostinger by the /wp-content rewrite in next.config.mjs.
// They sit in the same folder as blog/library images, which must stay public,
// so only COA-named files are gated: "coa" as its own token at the end of the
// filename (TB500COA.pdf, klow-coa-10mg.jpg), not "coating.png".
const WP_COA_FILE = /^\/wp-content\/uploads\/.*coa(?:[^a-z0-9][^/]*)?\.(?:pdf|jpe?g|png)$/i;

export async function middleware(req: NextRequest) {
  // Static assets under public/ (e.g. public/products/*.png) share the
  // /products prefix with the gated product-detail route, but a file
  // request should never be redirected to an HTML gate page. /documents/*
  // is the exception: those are COA/SDS files (served from private/ by
  // app/documents/[...path]/route.ts) and must always require the cookie.
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/wp-content/") && !WP_COA_FILE.test(pathname)) {
    return NextResponse.next();
  }
  const isDocument = pathname.startsWith("/documents/") || WP_COA_FILE.test(pathname);
  if (!isDocument && /\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Vercel Preview deployments never pass Turnstile -- Cloudflare flags
  // traffic through the preview's *.vercel.app domain as bot activity, so
  // the challenge always fails there regardless of the actual visitor.
  // VERCEL_ENV is set automatically by Vercel (not something to configure),
  // and is never "preview" in Production, so this can't leak the bypass.
  if (process.env.VERCEL_ENV === "preview") {
    return NextResponse.next();
  }

  const token = req.cookies.get(GATE_COOKIE_NAME)?.value;
  if (await verifyGateToken(token)) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Verification required" }, { status: 403 });
  }

  const gateUrl = new URL("/gate", req.url);
  gateUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(gateUrl);
}
