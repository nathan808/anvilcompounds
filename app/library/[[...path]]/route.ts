import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// AC Research Library lives on the same WordPress/WooCommerce install as
// this store's backend, but is only reachable directly at this
// Hostinger-assigned hostname -- the real domain (anvilcompounds.shop)
// force-redirects to this app, which has no /library route. A plain
// next.config.mjs rewrite gets the first click working, but this
// WordPress install builds every link (nav, "Registry", "Guides", ...)
// from whatever host it received the request on -- so a rewrite alone
// leaves every second click pointing at the raw Hostinger hostname
// instead of staying on www.anvilcompounds.shop. This route proxies the
// request itself and rewrites that hostname out of the returned HTML,
// so navigation stays on this domain all the way down.
const LIBRARY_ORIGIN = "https://paleturquoise-crane-581984.hostingersite.com";
const LIBRARY_HOST = new URL(LIBRARY_ORIGIN).host;

async function proxy(req: NextRequest) {
  // Next normalizes away any trailing slash on the incoming request
  // before this handler ever runs. WordPress's permalinks are all
  // trailing-slash canonical, so it's added back here -- otherwise
  // WordPress would 301 to the trailing-slash form itself, and that
  // redirect points at LIBRARY_ORIGIN directly.
  const targetUrl = `${LIBRARY_ORIGIN}${req.nextUrl.pathname}/${req.nextUrl.search}`;

  const upstream = await fetch(targetUrl, {
    headers: { "user-agent": req.headers.get("user-agent") ?? "" },
    redirect: "manual",
    cache: "no-store",
  });

  // WordPress's own redirects (canonical fixes, etc.) -- rewrite the
  // Location back onto this origin instead of following it out to the
  // raw Hostinger hostname.
  const location = upstream.headers.get("location");
  if (upstream.status >= 300 && upstream.status < 400 && location) {
    const rewritten = location.replace(LIBRARY_ORIGIN, req.nextUrl.origin);
    return NextResponse.redirect(rewritten, upstream.status);
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    const html = await upstream.text();
    // Three shapes the hostname shows up in: a plain URL in markup, a
    // JSON-escaped URL inside inline JSON-LD (backslash-escaped
    // slashes), and a bare hostname with no protocol at all (page
    // <title>, the age-gate heading's site-name output). Order matters:
    // the protocol-prefixed forms have to go first, or the plain
    // hostname pass would eat the host portion of the other two and
    // leave a mangled protocol behind.
    const rewritten = html
      .split(LIBRARY_ORIGIN).join(req.nextUrl.origin)
      .split(`https:\\/\\/${LIBRARY_HOST}`).join(`https:\\/\\/${req.nextUrl.host}`)
      .split(LIBRARY_HOST).join(req.nextUrl.host);
    return new NextResponse(rewritten, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}

export { proxy as GET };
