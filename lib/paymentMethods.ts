import { PAYMENT_CONFIG } from "@/lib/paymentConfig";

export type PaymentGroup = "instant" | "card" | "manual";
export type PaymentMethodId = keyof typeof PAYMENT_CONFIG;

export interface PaymentMethodMeta {
  id: PaymentMethodId;
  label: string;
  group: PaymentGroup;
  discountPercent: number;
  todoNote: string;
  // Not yet a real, working payment path (ACH/USDC-USDT: PayPageClient shows
  // a disabled "Not Yet Available" button for these — no LinkMoney/NOWPayments
  // integration exists). Kept in this list (rather than deleted) so historical
  // orders/types/place-order validation still resolve correctly; just excluded
  // from the Step 3 selection UI until the real integration ships.
  hidden?: boolean;
  badge?: string;
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { id: "bacs",      label: "Pay With Credit Card Via Invoice", group: "card",    discountPercent: 0,  todoNote: "Standard price, no discount.", badge: "SECURE LINK" },
  { id: "ethereum",  label: "Ethereum",     group: "instant", discountPercent: 10, todoNote: "Bankful hosted checkout — confirms in minutes." },
  { id: "usdc_usdt", label: "USDC / USDT",  group: "instant", discountPercent: 5,  todoNote: "TODO: trust/instruction copy — USDC/USDT (NOWPayments)", hidden: true },
  { id: "ach",       label: "ACH Transfer", group: "instant", discountPercent: 5,  todoNote: "TODO: trust/instruction copy — ACH (LinkMoney)", hidden: true },
  { id: "zelle",     label: "Zelle",        group: "manual",  discountPercent: 0,  todoNote: "Details shown after you place your order." },
];

export const GROUP_LABELS: Record<PaymentGroup, string> = {
  card: "Card",
  instant: "Pay direct — instant, and discounted",
  manual: "Bank transfer",
};

export const GROUP_SUBHEADS: Partial<Record<PaymentGroup, string>> = {
  card: "Standard price. Pay by secure link, not on this page.",
};

export const GROUP_ORDER: PaymentGroup[] = ["card", "instant", "manual"];
