import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId, getBearerToken } from "@/lib/verifyJwt";

// Addresses tab — billing and shipping edited as two genuinely separate WC
// customer sub-objects (previously app/api/account/profile/route.ts forced
// them to always match — see its git history). Each address is optional on
// its own: a customer can set only billing, only shipping, both, or neither.
export interface AddressFields {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

export interface AccountAddresses {
  billing: AddressFields;
  shipping: AddressFields;
}

interface WCAddress {
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
  billing?: WCAddress;
  shipping?: WCAddress;
}

function wcAuthHeader(): string | null {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function toFields(a?: WCAddress): AddressFields {
  return {
    firstName: a?.first_name ?? "",
    lastName: a?.last_name ?? "",
    address1: a?.address_1 ?? "",
    address2: a?.address_2 ?? "",
    city: a?.city ?? "",
    state: a?.state ?? "",
    zip: a?.postcode ?? "",
  };
}

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
]);

// An address is either fully blank (fine — customer hasn't set it) or
// complete enough to ship/bill to. Partial addresses (e.g. city with no
// zip) are rejected rather than silently saved unusable.
function validateAddress(a: AddressFields, label: string): string | null {
  const isBlank = !a.firstName.trim() && !a.lastName.trim() && !a.address1.trim() &&
    !a.address2.trim() && !a.city.trim() && !a.state.trim() && !a.zip.trim();
  if (isBlank) return null;

  if (!a.firstName.trim() || !a.lastName.trim()) return `${label}: first and last name are required.`;
  if (!a.address1.trim()) return `${label}: street address is required.`;
  if (!a.city.trim()) return `${label}: city is required.`;
  if (!US_STATES.has(a.state.trim().toUpperCase())) return `${label}: please select a valid state.`;
  if (!ZIP_RE.test(a.zip.trim())) return `${label}: please enter a valid ZIP code.`;
  return null;
}

function toWCAddress(existing: WCAddress | undefined, fields: AddressFields): WCAddress {
  return {
    ...existing,
    first_name: fields.firstName.trim(),
    last_name: fields.lastName.trim(),
    address_1: fields.address1.trim(),
    address_2: fields.address2.trim(),
    city: fields.city.trim(),
    state: fields.state.trim().toUpperCase(),
    postcode: fields.zip.trim(),
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
    return NextResponse.json({ error: "Could not load addresses" }, { status: res.status });
  }

  const customer = (await res.json()) as WCCustomer;
  return NextResponse.json({
    billing: toFields(customer.billing),
    shipping: toFields(customer.shipping),
  } satisfies AccountAddresses);
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

  const body = (await req.json().catch(() => null)) as Partial<AccountAddresses> | null;
  const blank: AddressFields = { firstName: "", lastName: "", address1: "", address2: "", city: "", state: "", zip: "" };
  const billing = { ...blank, ...body?.billing };
  const shipping = { ...blank, ...body?.shipping };

  const billingError = validateAddress(billing, "Billing address");
  if (billingError) return NextResponse.json({ error: billingError }, { status: 400 });
  const shippingError = validateAddress(shipping, "Shipping address");
  if (shippingError) return NextResponse.json({ error: shippingError }, { status: 400 });

  // Fetch-then-merge — see the same rationale in app/api/account/profile,
  // this time to preserve email/phone/company on billing (fields this tab
  // doesn't own) rather than wiping them.
  const currentRes = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
    headers: { Authorization: auth },
  });
  if (!currentRes.ok) {
    return NextResponse.json({ error: "Could not update addresses" }, { status: currentRes.status });
  }
  const current = (await currentRes.json()) as WCCustomer;

  const res = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${customerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({
      billing: toWCAddress(current.billing, billing),
      shipping: toWCAddress(current.shipping, shipping),
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not update addresses" }, { status: res.status });
  }

  const customer = (await res.json()) as WCCustomer;
  return NextResponse.json({
    billing: toFields(customer.billing),
    shipping: toFields(customer.shipping),
  } satisfies AccountAddresses);
}
