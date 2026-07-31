import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";

export interface AccountProfile {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

interface WCCustomer {
  email: string;
  first_name: string;
  last_name: string;
  billing: {
    phone?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
}

function wcAuthHeader(): string | null {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function toProfile(c: WCCustomer): AccountProfile {
  return {
    email: c.email,
    firstName: c.first_name,
    lastName: c.last_name,
    phone: c.billing?.phone ?? "",
    address1: c.billing?.address_1 ?? "",
    address2: c.billing?.address_2 ?? "",
    city: c.billing?.city ?? "",
    state: c.billing?.state ?? "",
    zip: c.billing?.postcode ?? "",
  };
}

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
    return NextResponse.json({ error: "Could not load profile" }, { status: res.status });
  }

  const customer = (await res.json()) as WCCustomer;
  return NextResponse.json(toProfile(customer));
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

  const body = await req.json().catch(() => null) as Partial<AccountProfile> | null;
  if (!body || !body.firstName?.trim() || !body.lastName?.trim()) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }

  // Email and date of birth are the customer's login credentials
  // (derivePassword in app/api/auth/*) — deliberately not editable here to
  // avoid silently breaking sign-in; changes to those go through support.
  const address = {
    address_1: body.address1?.trim() ?? "",
    address_2: body.address2?.trim() ?? "",
    city: body.city?.trim() ?? "",
    state: body.state?.trim() ?? "",
    postcode: body.zip?.trim() ?? "",
    first_name: body.firstName.trim(),
    last_name: body.lastName.trim(),
  };

  const res = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({
      first_name: body.firstName.trim(),
      last_name: body.lastName.trim(),
      billing: { ...address, phone: body.phone?.trim() ?? "" },
      // This store only ever collects one address (see place-order's
      // billing/shipping mirroring) — keep shipping in sync with billing.
      // The shipping schema has no phone field, unlike billing.
      shipping: address,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not update profile" }, { status: res.status });
  }

  const customer = (await res.json()) as WCCustomer;
  return NextResponse.json(toProfile(customer));
}
