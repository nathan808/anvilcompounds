"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

// Public shape is unchanged from the pre-NextAuth version on purpose — every
// consumer (checkout, COA gating, ProductsSection, ReconstitutionGuide,
// AccountDashboard, etc.) reads user/isAuthenticated/hydrated and never
// touched localStorage directly, so none of them need to change now that
// the session itself is owned by next-auth (see SessionProvider below)
// instead of a hand-rolled localStorage blob.
export interface AnvilUser {
  email: string;
  firstName: string;
  lastName: string;
  wcCustomerId: number;
  token: string;
}

interface AuthContextType {
  user: AnvilUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  // True right after a brand-new Google sign-in (or an existing WC customer
  // missing anvil_birthday) — no usable WP JWT yet until DOB + RUO ack are
  // submitted via completeProfile(). See app/account/page.tsx.
  needsCompletion: boolean;
  authError: string | null;
  login: (identifier: string, birthday: string) => Promise<void>;
  loginWithCode: (identifier: string, code: string) => Promise<void>;
  register: (
    email: string,
    birthday: string,
    firstName: string,
    lastName: string,
    researchAffiliationConfirmed: boolean,
    phone?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeProfile: (birthday: string, researchAffiliationConfirmed: boolean, phone?: string) => Promise<void>;
  sendTwoFactor: (identifier: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

function InnerAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [authError, setAuthError] = useState<string | null>(null);

  const hydrated = status !== "loading";
  const user: AnvilUser | null =
    session?.user && session.user.wcCustomerId
      ? {
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          wcCustomerId: session.user.wcCustomerId,
          token: session.user.wpJwt,
        }
      : null;
  const needsCompletion = !!session?.user?.needsCompletion;
  // A Google account mid-completion is a real (signed-in) session but has
  // no WP JWT yet — isAuthenticated stays false until that's resolved, same
  // as the pre-NextAuth flow where nothing was considered "logged in" until
  // a JWT existed.
  const isAuthenticated = !!user && !!user.token;

  const login = async (identifier: string, birthday: string) => {
    setAuthError(null);
    const res = await signIn("credentials-dob", { identifier, birthday, redirect: false });
    if (res?.error) {
      setAuthError("AUTH_FAILED");
      throw Object.assign(new Error("Incorrect details, or no account found."), { code: "AUTH_FAILED" });
    }
  };

  const loginWithCode = async (identifier: string, code: string) => {
    setAuthError(null);
    const res = await signIn("credentials-otp", { identifier, code, redirect: false });
    if (res?.error) {
      setAuthError("VERIFY_FAILED");
      throw Object.assign(new Error("Invalid or expired code."), { code: "VERIFY_FAILED" });
    }
  };

  const register = async (
    email: string,
    birthday: string,
    firstName: string,
    lastName: string,
    researchAffiliationConfirmed: boolean,
    phone?: string
  ) => {
    setAuthError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, birthday, firstName, lastName, researchAffiliationConfirmed, phone }),
    });
    const data = (await res.json()) as { error?: string; message?: string };
    if (!res.ok || data.error) {
      setAuthError(data.error ?? "REGISTER_FAILED");
      throw Object.assign(new Error(data.message ?? "Registration failed"), { code: data.error });
    }
    // Registration only creates the WC customer — sign in right after with
    // the same credentials to establish the actual session/JWT.
    await login(email, birthday);
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    await signIn("google", { callbackUrl: "/account" });
  };

  const completeProfile = async (birthday: string, researchAffiliationConfirmed: boolean, phone?: string) => {
    setAuthError(null);
    const res = await fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthday, researchAffiliationConfirmed, phone }),
    });
    const data = (await res.json()) as { wpJwt?: string; firstName?: string; lastName?: string; error?: string };
    if (!res.ok || data.error) {
      setAuthError("COMPLETE_PROFILE_FAILED");
      throw Object.assign(new Error(data.error ?? "Could not complete your profile."), { code: "COMPLETE_PROFILE_FAILED" });
    }
    // Pushes the new WP JWT into the NextAuth token via the jwt callback's
    // trigger === "update" branch (see lib/authOptions.ts).
    await update({ wpJwt: data.wpJwt, firstName: data.firstName, lastName: data.lastName });
  };

  const sendTwoFactor = async (identifier: string) => {
    const endpoint = isEmail(identifier) ? "/api/auth/send-2fa" : "/api/auth/send-phone-otp";
    const payload = isEmail(identifier) ? { email: identifier } : { phone: identifier };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string; error?: string };
      throw new Error(data.message ?? data.error ?? "Failed to send code.");
    }
  };

  const logout = () => {
    setAuthError(null);
    signOut({ callbackUrl: "/" });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        hydrated,
        needsCompletion,
        authError,
        login,
        loginWithCode,
        register,
        loginWithGoogle,
        completeProfile,
        sendTwoFactor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
