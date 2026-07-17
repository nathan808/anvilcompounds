"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface AnvilUser {
  email: string;
  firstName: string;
  lastName: string;
  wcCustomerId: number;
  token: string;
}

interface StoredAuth extends AnvilUser {
  storedAt: number;
}

interface AuthContextType {
  user: AnvilUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  authError: string | null;
  login: (email: string, birthday: string) => Promise<void>;
  register: (
    email: string,
    birthday: string,
    firstName: string,
    lastName: string,
    researchPurpose: string,
    researchPurposeOther?: string
  ) => Promise<void>;
  sendTwoFactor: (email: string) => Promise<void>;
  verifyTwoFactor: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "anvil_auth";

function getJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf8")
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = getJwtExpiry(token);
  if (exp === null) return false;
  return Date.now() / 1000 > exp;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnvilUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredAuth = JSON.parse(stored);
        if (parsed.token && !isTokenExpired(parsed.token)) {
          const { storedAt: _s, ...userFields } = parsed;
          void _s;
          setUser(userFields);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  const storeUser = (u: AnvilUser) => {
    const record: StoredAuth = { ...u, storedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    setUser(u);
    setAuthError(null);
  };

  const login = async (email: string, birthday: string) => {
    setAuthError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, birthday }),
    });
    const data = (await res.json()) as {
      token?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      wcCustomerId?: number;
      error?: string;
      message?: string;
    };
    if (!res.ok || data.error) {
      const err = data as { error: string; message: string };
      setAuthError(err.error ?? "LOGIN_FAILED");
      throw Object.assign(new Error(err.message ?? "Login failed"), { code: err.error });
    }
    storeUser({
      token: data.token!,
      email: data.email!,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      wcCustomerId: data.wcCustomerId ?? 0,
    });
  };

  const register = async (
    email: string,
    birthday: string,
    firstName: string,
    lastName: string,
    researchPurpose: string,
    researchPurposeOther?: string
  ) => {
    setAuthError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, birthday, firstName, lastName, researchPurpose, researchPurposeOther }),
    });
    const data = (await res.json()) as {
      token?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      wcCustomerId?: number;
      error?: string;
      message?: string;
    };
    if (!res.ok || data.error) {
      const err = data as { error: string; message: string };
      setAuthError(err.error ?? "REGISTER_FAILED");
      throw Object.assign(new Error(err.message ?? "Registration failed"), { code: err.error });
    }
    storeUser({
      token: data.token!,
      email: data.email!,
      firstName: data.firstName ?? firstName,
      lastName: data.lastName ?? lastName,
      wcCustomerId: data.wcCustomerId ?? 0,
    });
  };

  const sendTwoFactor = async (email: string) => {
    const res = await fetch("/api/auth/send-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message ?? "Failed to send code.");
    }
  };

  const verifyTwoFactor = async (email: string, code: string) => {
    setAuthError(null);
    const res = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = (await res.json()) as {
      token?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      wcCustomerId?: number;
      error?: string;
      message?: string;
    };
    if (!res.ok || data.error) {
      const err = data as { error: string; message: string };
      setAuthError(err.error ?? "VERIFY_FAILED");
      throw Object.assign(new Error(err.message ?? "Verification failed"), { code: err.error });
    }
    storeUser({
      token: data.token!,
      email: data.email!,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      wcCustomerId: data.wcCustomerId ?? 0,
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAuthError(null);
  };

  const isAuthenticated = !!user && !isTokenExpired(user.token);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        hydrated,
        authError,
        login,
        register,
        sendTwoFactor,
        verifyTwoFactor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
