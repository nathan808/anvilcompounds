import { NextRequest, NextResponse } from "next/server";
import { fetchTaxRate } from "@/lib/wcTax";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state") ?? "";
  try {
    const info = await fetchTaxRate(state);
    return NextResponse.json(info);
  } catch (err) {
    console.error("[tax-rate] FAIL:", err);
    return NextResponse.json({ error: "Could not load tax rate" }, { status: 500 });
  }
}
