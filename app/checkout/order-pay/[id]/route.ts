import { type NextRequest } from "next/server";

// Hostinger/WordPress is at anvilcompounds.shop, but Hostinger proxies /checkout/* to Vercel.
// Redirecting to the Hostinger hostname directly bypasses the proxy and lets WooCommerce
// serve the WC order-pay page (which the Bankful plugin then redirects to Bankful).
const WP_HOST = "paleturquoise-crane-581984.hostingersite.com";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const target = `https://${WP_HOST}/checkout/order-pay/${id}/?pay_for_order=true&key=${key}`;
  return Response.redirect(target, 307);
}
