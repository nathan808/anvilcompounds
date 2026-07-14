import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/wcCoupon";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8).toUpperCase();

  let body: { code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "Invalid request" }, { status: 400 });
  }

  const code = body.code ?? "";
  const subtotal = typeof body.subtotal === "number" ? body.subtotal : 0;

  try {
    const result = await validateCoupon(code, subtotal);
    return NextResponse.json(result);
  } catch (err) {
    console.error(`[coupon:${requestId}] FAIL:`, err);
    return NextResponse.json({ error: "Could not validate coupon" }, { status: 500 });
  }
}
