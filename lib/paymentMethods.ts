import { PAYMENT_CONFIG } from "@/lib/paymentConfig";

export type PaymentGroup = "instant" | "card" | "manual";
export type PaymentMethodId = keyof typeof PAYMENT_CONFIG;

export interface PaymentMethodMeta {
  id: PaymentMethodId;
  label: string;
  group: PaymentGroup;
  discountPercent: number;
  todoNote: string;
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { id: "bacs",      label: "Pay With Credit Card Via Invoice", group: "card",    discountPercent: 0,  todoNote: "Our team will follow up by email with a secure payment link." },
  { id: "ethereum",  label: "Ethereum",     group: "instant", discountPercent: 10, todoNote: "TODO: trust/instruction copy — Ethereum (Bankful)" },
  { id: "usdc_usdt", label: "USDC / USDT",  group: "instant", discountPercent: 5,  todoNote: "TODO: trust/instruction copy — USDC/USDT (NOWPayments)" },
  { id: "ach",       label: "ACH Transfer", group: "instant", discountPercent: 5,  todoNote: "TODO: trust/instruction copy — ACH (LinkMoney)" },
  { id: "zelle",     label: "Zelle",        group: "manual",  discountPercent: 0,  todoNote: "TODO: trust/instruction copy — Zelle" },
];

export const GROUP_LABELS: Record<PaymentGroup, string> = {
  card: "Card",
  instant: "Instant — discounted",
  manual: "Manual",
};

export const GROUP_ORDER: PaymentGroup[] = ["card", "instant", "manual"];
