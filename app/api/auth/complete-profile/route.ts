import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { derivePassword, fetchWpJwt, findWcCustomerByEmail, toE164, updateWcCustomer } from "@/lib/wcAuth";

const BIRTHDAY_RE = /^\d{2}\/\d{2}\/\d{4}$/;

// Captures the one thing every provider still needs regardless of how the
// customer signed in (per explicit product requirement: DOB + RUO ack for
// the 21+ gate, always) — called once, right after a brand-new Google
// sign-in (or an existing WC customer found by email with no anvil_birthday
// on file yet). Also the point where a phone number can optionally be added
// for future phone/SMS sign-in.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.wcCustomerId || !session.user.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { birthday?: string; researchAffiliationConfirmed?: boolean; phone?: string }
    | null;
  const birthday = (body?.birthday ?? "").trim();
  const phone = (body?.phone ?? "").trim();

  if (!BIRTHDAY_RE.test(birthday)) {
    return NextResponse.json({ error: "Please enter a valid date of birth (MM/DD/YYYY)." }, { status: 400 });
  }
  if (!body?.researchAffiliationConfirmed) {
    return NextResponse.json({ error: "Please confirm your research affiliation to continue." }, { status: 400 });
  }
  let e164: string | null = null;
  if (phone) {
    e164 = toE164(phone);
    if (!e164) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
  }

  // Fetch-then-merge billing — same rationale as app/api/account/profile:
  // an existing WC customer (found by email, just missing anvil_birthday)
  // may already have a full billing address on file that a bare
  // { billing: { phone } } write would otherwise risk clobbering.
  const current = await findWcCustomerByEmail(session.user.email);
  if (!current) {
    return NextResponse.json({ error: "Could not complete your profile. Please try again." }, { status: 502 });
  }

  const password = derivePassword(current.email, birthday);
  const updated = await updateWcCustomer(current.id, {
    password,
    meta_data: [
      { key: "anvil_birthday", value: birthday },
      { key: "anvil_research_affiliation_confirmed", value: "true" },
    ],
    ...(e164 ? { billing: { ...current.billing, phone: e164 } } : {}),
  });
  if (!updated) {
    return NextResponse.json({ error: "Could not complete your profile. Please try again." }, { status: 502 });
  }

  const wpJwt = await fetchWpJwt(current.email, password);
  if (!wpJwt) {
    return NextResponse.json({ error: "Could not complete your profile. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    wpJwt,
    firstName: updated.first_name,
    lastName: updated.last_name,
  });
}
