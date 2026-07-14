"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { PaymentMethodId } from "@/lib/paymentMethods";

export interface CheckoutStep1Data {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  ruoConfirmed: boolean;
}

export interface CheckoutCoupon {
  code: string;
  discountType: "percent" | "fixed_cart";
  amount: number;
}

export interface CheckoutShipping {
  methodId: string;
  instanceId: number;
  title: string;
  cost: number;
}

interface CheckoutState {
  step1: CheckoutStep1Data;
  coupon: CheckoutCoupon | null;
  shipping: CheckoutShipping | null;
  paymentMethodId: PaymentMethodId | null;
}

const DEFAULT_STEP1: CheckoutStep1Data = {
  email: "", phone: "",
  firstName: "", lastName: "",
  address1: "", address2: "", city: "", state: "CA", zip: "",
  ruoConfirmed: false,
};

const STORAGE_KEY = "anvil_checkout";

interface CheckoutContextType {
  step1: CheckoutStep1Data;
  setStep1: (patch: Partial<CheckoutStep1Data>) => void;
  coupon: CheckoutCoupon | null;
  setCoupon: (coupon: CheckoutCoupon | null) => void;
  shipping: CheckoutShipping | null;
  setShipping: (shipping: CheckoutShipping | null) => void;
  paymentMethodId: PaymentMethodId | null;
  setPaymentMethodId: (id: PaymentMethodId | null) => void;
  hydrated: boolean;
}

const CheckoutContext = createContext<CheckoutContextType | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckoutState>({ step1: DEFAULT_STEP1, coupon: null, shipping: null, paymentMethodId: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CheckoutState>;
        setState((prev) => ({
          step1: { ...prev.step1, ...parsed.step1 },
          coupon: parsed.coupon ?? null,
          shipping: parsed.shipping ?? null,
          paymentMethodId: parsed.paymentMethodId ?? null,
        }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  const setStep1 = (patch: Partial<CheckoutStep1Data>) => {
    setState((prev) => ({ ...prev, step1: { ...prev.step1, ...patch } }));
  };

  const setCoupon = (coupon: CheckoutCoupon | null) => {
    setState((prev) => ({ ...prev, coupon }));
  };

  const setShipping = (shipping: CheckoutShipping | null) => {
    setState((prev) => ({ ...prev, shipping }));
  };

  const setPaymentMethodId = (paymentMethodId: PaymentMethodId | null) => {
    setState((prev) => ({ ...prev, paymentMethodId }));
  };

  return (
    <CheckoutContext.Provider value={{
      step1: state.step1, setStep1,
      coupon: state.coupon, setCoupon,
      shipping: state.shipping, setShipping,
      paymentMethodId: state.paymentMethodId, setPaymentMethodId,
      hydrated,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider");
  return ctx;
}
