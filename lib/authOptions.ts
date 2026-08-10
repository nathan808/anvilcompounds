import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  derivePassword,
  fetchWpJwt,
  findWcCustomerByEmail,
  findWcCustomerByPhone,
  createWcCustomer,
  updateWcCustomer,
  getMeta,
  toE164,
  type WCCustomer,
} from "@/lib/wcAuth";
import { checkPhoneOtp } from "@/lib/twilioVerify";

// Resolves an "identifier" field (either an email or a US phone number,
// whichever the sign-in form was set to) to a WC customer.
async function findCustomer(identifier: string): Promise<WCCustomer | null> {
  const raw = identifier.trim();
  return raw.includes("@")
    ? findWcCustomerByEmail(raw.toLowerCase())
    : findWcCustomerByPhone(raw);
}

// Shared by both Credentials providers once identity is verified — mints
// the same WP JWT convention every existing /api/account/* route expects.
async function toSessionUser(customer: WCCustomer) {
  const birthday = getMeta(customer, "anvil_birthday");
  if (!birthday) return null; // registered but never completed DOB capture
  const password = derivePassword(customer.email, birthday);
  const wpJwt = await fetchWpJwt(customer.email, password);
  if (!wpJwt) return null;
  return {
    id: String(customer.id),
    email: customer.email,
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    wcCustomerId: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    wpJwt,
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/account" },
  providers: [
    CredentialsProvider({
      id: "credentials-dob",
      name: "Email or Phone + Date of Birth",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        birthday: { label: "Date of birth", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.birthday) return null;
        const customer = await findCustomer(credentials.identifier);
        if (!customer) return null;
        const storedBirthday = getMeta(customer, "anvil_birthday");
        if (!storedBirthday || storedBirthday !== credentials.birthday.trim()) return null;
        return toSessionUser(customer);
      },
    }),
    CredentialsProvider({
      id: "credentials-otp",
      name: "Email or Phone + One-Time Code",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.code) return null;
        const raw = credentials.identifier.trim();
        const isEmail = raw.includes("@");
        const customer = await findCustomer(raw);
        if (!customer) return null;

        if (isEmail) {
          const storedCode = getMeta(customer, "anvil_2fa_code");
          const storedExpiry = getMeta(customer, "anvil_2fa_expiry");
          if (!storedCode || storedCode !== credentials.code.trim()) return null;
          if (storedExpiry && Math.floor(Date.now() / 1000) > parseInt(storedExpiry, 10)) return null;
          await updateWcCustomer(customer.id, {
            meta_data: [
              { key: "anvil_2fa_code", value: "" },
              { key: "anvil_2fa_expiry", value: "" },
            ],
          });
        } else {
          const e164 = toE164(customer.billing?.phone ?? raw);
          if (!e164) return null;
          const ok = await checkPhoneOtp(e164, credentials.code.trim());
          if (!ok) return null;
        }

        return toSessionUser(customer);
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    // account/user are only present on the initial sign-in request, not on
    // every subsequent token refresh — everything here only runs once per
    // sign-in, plus once more when the client explicitly calls
    // session.update() from the complete-profile step (trigger === "update").
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === "google" && user?.email) {
        let customer = await findWcCustomerByEmail(user.email);
        let needsCompletion = false;

        if (!customer) {
          const [firstName, ...rest] = (user.name ?? "").split(" ");
          const { customer: created } = await createWcCustomer({
            email: user.email,
            username: user.email,
            first_name: firstName || "",
            last_name: rest.join(" "),
          });
          customer = created;
          needsCompletion = true;
        } else if (!getMeta(customer, "anvil_birthday")) {
          needsCompletion = true;
        }

        if (!customer) return token; // WC customer creation failed — leave token as-is, session() will lack wcCustomerId

        token.wcCustomerId = customer.id;
        token.email = customer.email;
        token.firstName = customer.first_name;
        token.lastName = customer.last_name;
        token.needsCompletion = needsCompletion;

        if (!needsCompletion) {
          const birthday = getMeta(customer, "anvil_birthday");
          const password = derivePassword(customer.email, birthday);
          token.wpJwt = (await fetchWpJwt(customer.email, password)) ?? undefined;
        }
      } else if (user) {
        // Credentials providers already return a fully-resolved session user.
        token.wcCustomerId = user.wcCustomerId;
        token.email = user.email ?? token.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.wpJwt = user.wpJwt;
        token.needsCompletion = false;
      }

      // Fired by the client's session.update(...) call after
      // /api/auth/complete-profile succeeds — see app/account/page.tsx.
      if (trigger === "update" && session) {
        if (session.wpJwt) token.wpJwt = session.wpJwt;
        if (session.firstName) token.firstName = session.firstName;
        if (session.lastName) token.lastName = session.lastName;
        token.needsCompletion = false;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email ?? session.user.email ?? "";
      session.user.firstName = token.firstName ?? "";
      session.user.lastName = token.lastName ?? "";
      session.user.wcCustomerId = token.wcCustomerId ?? 0;
      session.user.wpJwt = token.wpJwt ?? "";
      session.user.needsCompletion = token.needsCompletion ?? false;
      return session;
    },
  },
};
