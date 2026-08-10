import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";

// Account Details tab — name + phone only. Addresses (billing/shipping)
// moved to app/api/account/addresses/route.ts so the two concerns can be
// edited/validated independently instead of one form covering both.
export interface AccountDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface WCBilling {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

interface WCCustomer {
  email: string;
  first_name: string;
  last_name: string;
  billing?: WCBilling;
}

function wcAuthHeader(): string | null {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function toDetails(c: WCCustomer): AccountDetails {
  return {
    email: c.email,
    firstName: c.first_name,
    lastName: c.last_name,
    phone: c.billing?.phone ?? "",
  };
}

// Loose on purpose — just enough to catch obvious garbage without rejecting
// real international formats. Digits, spaces, and + - ( ) only, 7-20 chars.
const PHONE_RE = /^[\d\s()+-]{7,20}$/;

export async function GET(req: NextRequest) {
  const customerId = await getAuthenticatedCustomerId(getBearerToken(req));
  if (!customerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const res = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Could not load account details" }, { status: res.status });
  }

  const customer = (await res.json()) as WCCustomer;
  return NextResponse.json(toDetails(customer));
}

export async function PUT(req: NextRequest) {
  const customerId = await getAuthenticatedCustomerId(getBearerToken(req));
  if (!customerId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as Partial<AccountDetails> | null;
  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();
  const phone = (body?.phone ?? "").trim();

  if (!firstName || firstName.length > 60) {
    return NextResponse.json({ error: "Please enter a valid first name." }, { status: 400 });
  }
  if (!lastName || lastName.length > 60) {
    return NextResponse.json({ error: "Please enter a valid last name." }, { status: 400 });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  // Fetch-then-merge rather than PUTting a bare { billing: { phone } } —
  // guards against WC replacing the whole billing sub-object instead of
  // merging field-by-field, which would silently wipe out the billing
  // address set via the Addresses tab.
  const currentRes = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
    headers: { Authorization: auth },
  });
  if (!currentRes.ok) {
    return NextResponse.json({ error: "Could not update account details" }, { status: currentRes.status });
  }
  const current = (await currentRes.json()) as WCCustomer;

  const res = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      billing: { ...current.billing, phone },
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not update account details" }, { status: res.status });
  }

  const customer = (await res.json()) as WCCustomer;
  return NextResponse.json(toDetails(customer));
}
