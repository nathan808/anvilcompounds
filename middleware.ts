import { NextRequest, NextResponse } from "next/server";
import { verifyGateToken, GATE_COOKIE_NAME } from "@/lib/gateAuth";

// Gates the routes that actually expose product names/prices — catalog,
// product pages, COAs, checkout — behind Turnstile + attestation (see
// app/gate). Marketing pages (home hero, testing process, FAQ, blog, about)
// are deliberately left out so they stay indexable; only the routes a
// payment-processor crawler would flag sit behind this.
export const config = {
  matcher: [
    "/catalog/:path*",
    "/products/:path*",
    "/coas/:path*",
    "/checkout/:path*",
    "/api/products/:path*",
    "/api/checkout/:path*",
  ],
};

export async function middleware(req: NextRequest) {
  // Static assets under public/ (e.g. public/products/*.png) share the
  // /products prefix with the gated product-detail route, but a file
  // request should never be redirected to an HTML gate page.
  if (/\.[a-zA-Z0-9]+$/.test(req.nextUrl.pathname)) {
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
