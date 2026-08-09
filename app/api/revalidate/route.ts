import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Manual trigger to bust the 1hr WooCommerce fetch cache (lib/woocommerce.ts)
// and the 1hr WordPress blog fetch cache (app/api/blog, app/blog/[slug])
// immediately after a catalog or blog change, instead of waiting for the
// window to expire. A redeploy does NOT do this on its own -- the Next.js
// Data Cache persists across deployments.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("wc-products");
  revalidateTag("wp-posts");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
