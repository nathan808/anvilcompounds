import { PaymentMethodId } from "@/lib/paymentMethods";

export interface PaymentInstructionsContext {
  orderNumber: string;
  total: string; // pre-formatted, e.g. "$53.18"
  holdExpiryDate: string; // pre-formatted, e.g. "July 17, 2026"
}

export interface PaymentInstructionCopy {
  heading: string;
  trustLine: string; // one line of trust/instruction copy — empty string if none applies
  lines: string[];
}

// Single source of truth for payment instruction copy. This is plain data —
// no JSX, no React import needed to read it — so a future transactional
// email template can consume PAYMENT_INSTRUCTIONS_COPY directly without
// depending on this component's rendering.
//
// None of these entries receive line-item data, and none may reference a
// product name, compound name, or research-chemical term — the shared
// context above (order number / total / hold date) is all that's available.
export const PAYMENT_INSTRUCTIONS_COPY: Record<PaymentMethodId, PaymentInstructionCopy> = {
  ethereum: {
    heading: "Pay with Ethereum",
    trustLine: "Your bank statement will show a charge from Anvil Holdings LLC. This is our payment processing partner.",
    lines: [
      "You'll be redirected to our secure payment partner, Bankful, to complete your payment.",
      "This method includes a 10% instant-payment discount, already reflected in your total.",
    ],
  },
  echeck: {
    heading: "Pay with E-check",
    trustLine: "Your bank statement will show a charge from Anvil Holdings LLC. This is our payment processing partner.",
    lines: [
      "You'll be redirected to our secure payment partner, Bankful, to complete your payment by e-check.",
      "This method includes a 10% instant-payment discount, already reflected in your total.",
    ],
  },
  zelle: {
    heading: "Pay with Zelle",
    trustLine: "",
    lines: [
      "Send the exact total shown above via Zelle to the phone number provided.",
      "In the Zelle memo, enter ONLY your order number. Do not describe the items.",
      "Your order ships once payment is confirmed, typically within 1–4 hours during business hours.",
    ],
  },
  usdc_usdt: {
    heading: "Pay with USDC / USDT",
    trustLine: "",
    lines: [
      "This payment method includes a 5% instant-payment discount, already reflected in your total.",
      "Crypto payment processing for this order will be available shortly. Our team will follow up by email with next steps.",
    ],
  },
  ach: {
    heading: "Pay with ACH Transfer",
    trustLine: "",
    lines: [
      "This payment method includes a 5% instant-payment discount, already reflected in your total.",
      "ACH transfer processing for this order will be available shortly. Our team will follow up by email with next steps.",
    ],
  },
  stripe: {
    heading: "Pay with Card",
    trustLine: "",
    lines: [
      "Card payments are processed at the full posted price — no discount applies to this method.",
      "Card payment processing for this order will be available shortly. Our team will follow up by email with next steps.",
    ],
  },
};

interface PaymentInstructionsProps {
  methodId: PaymentMethodId;
  context: PaymentInstructionsContext;
}

export default function PaymentInstructions({ methodId, context }: PaymentInstructionsProps) {
  const copy = PAYMENT_INSTRUCTIONS_COPY[methodId];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h3 className="font-display font-700 text-white text-lg">{copy.heading}</h3>

      <div className="space-y-2 border-t border-white/8 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-white/50">Order Number</span>
          <span className="font-mono text-sm text-white/80">#{context.orderNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-white/50">Total</span>
          <span className="font-display font-700 text-white">{context.total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-white/50">Held Until</span>
          <span className="font-mono text-sm text-white/70">{context.holdExpiryDate}</span>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/8 pt-4">
        {copy.lines.map((line, i) => (
          <p key={i} className="font-body text-sm text-white/60 leading-relaxed">{line}</p>
        ))}
      </div>

      {copy.trustLine && (
        <p className="font-mono text-[11px] text-white/30 leading-relaxed border-t border-white/8 pt-4">
          {copy.trustLine}
        </p>
      )}
    </div>
  );
}
