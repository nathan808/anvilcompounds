import { NextRequest, NextResponse } from "next/server";
import { fetchShippingOptions } from "@/lib/wcShipping";

export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8).toUpperCase();

  const subtotal = parseFloat(req.nextUrl.searchParams.get("subtotal") ?? "0") || 0;
  const hasCoupon = req.nextUrl.searchParams.get("hasCoupon") === "true";

  try {
    const methods = await fetchShippingOptions(subtotal, hasCoupon);
    return NextResponse.json({ methods });
  } catch (err) {
    console.error(`[shipping:${requestId}] FAIL:`, err);
    return NextResponse.json({ error: "Could not load shipping methods" }, { status: 502 });
  }
}
