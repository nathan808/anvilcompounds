// Single source of FAQ content — shared by the /learn FAQ tab and the
// collapsible FAQ block on each product page, so the two never drift apart.
export interface FaqItem {
  q: string;
  a: string;
}

export const faqs: { category: string; items: FaqItem[] }[] = [
  {
    category: "Ordering & Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "Credit and debit card, via a secure payment link: place your order and the link arrives by email within 15 minutes, with a badge marking it as our secure-link option — no card details are ever entered on this site. Also live: Ethereum (via our payment partner Bankful, with an instant 10% discount) and Zelle to our business account (orders up to $2,000). ACH bank transfer and USDC/USDT are coming soon — check back for availability. Orders are held for 72 hours pending payment, after which they're released if no payment is received.",
      },
      {
        q: "How long is my order held after checkout?",
        a: "Reserved orders are held for 72 hours from the time of checkout. If payment is not received within that window, the order is released and inventory is returned to stock. To avoid delays, complete payment as soon as you receive your confirmation email.",
      },
      {
        q: "Can I cancel or modify my order?",
        a: "Orders can be cancelled or modified before payment is confirmed. Once payment clears and fulfillment begins, changes cannot be made. Contact support@anvilcompounds.shop immediately if you need to make adjustments.",
      },
      {
        q: "Do you require an account to order?",
        a: "No account is required to place an order. Guest checkout is available. Creating an account lets you view order history and track fulfillment status. Checked out as a guest? You can still look up your order anytime with your order number and email under Account → Find My Order — no account needed.",
      },
    ],
  },
  {
    category: "Shipping",
    items: [
      {
        q: "How fast do orders ship?",
        a: "Orders placed before 12PM PST on business days ship the same day via USPS Priority Mail. Orders placed after 12PM PST ship the following business day. Tracking is provided at dispatch.",
      },
      {
        q: "Do you ship internationally?",
        a: "Anvil Compounds currently ships within the United States only. International shipping involves regulatory complexity that varies by jurisdiction — we do not ship to addresses outside the US at this time.",
      },
      {
        q: "How are compounds packaged?",
        a: "All compounds ship in sealed glass vials inside plain outer packaging. No product names, brand identifiers, or compound names appear on the exterior. Lyophilized compounds are stable at ambient temperature during transit and do not require cold-chain shipping.",
      },
      {
        q: "What if my package is damaged in transit?",
        a: "Contact support@anvilcompounds.shop with your order number and photos of the damage within 48 hours of delivery. We will arrange a replacement shipment for verified transit damage.",
      },
    ],
  },
  {
    category: "Quality & Testing",
    items: [
      {
        q: "Can I verify my COA independently?",
        a: "Yes — that's the entire point. Every product page links to the current lot's verification page hosted by the issuing laboratory. You can verify any certificate before purchase, after delivery, or at any time. The verification link opens the lab's public database entry for that specific lot — confirming results were not self-reported by Anvil Compounds.",
      },
      {
        q: "What happens if a batch fails testing?",
        a: "Failed batches don't ship. If a lot tests below our 98% purity threshold, fails mass spectrometry identity confirmation, or shows elevated endotoxin levels, the entire lot is rejected. We don't sell what we wouldn't ship to ourselves. Failed lots are not discounted, relabeled, or sold through secondary channels.",
      },
      {
        q: "What testing methods do you use?",
        a: "Every lot undergoes three independent tests: HPLC (high-performance liquid chromatography) for purity quantification, mass spectrometry for molecular identity confirmation, and LAL (limulus amebocyte lysate) assay for endotoxin screening. All three must pass before a lot is released for sale.",
      },
      {
        q: "How do I read a COA?",
        a: "A Certificate of Analysis (COA) documents the results of laboratory testing for a specific lot. Key fields: Purity (HPLC) — should read 98% or higher. Identity (MS) — confirms the compound matches its expected molecular weight. Endotoxin — should read below threshold (typically ≤1 EU/mg). Lot ID — matches the ID printed on your vial. Analysis Date — confirms the test was recent.",
      },
    ],
  },
  {
    category: "Research Use",
    items: [
      {
        q: 'What does "research use only" mean?',
        a: "Research Use Only (RUO) is a regulatory designation indicating that a product is intended exclusively for laboratory and scientific research. RUO products are not approved for human consumption, veterinary use, or clinical application. They are not pharmaceutical-grade drugs. Purchasing RUO compounds carries an implicit and explicit obligation to use them solely for in vitro research purposes.",
      },
      {
        q: "Can these compounds be used by humans?",
        a: "No. All Anvil Compounds products are sold strictly for in vitro laboratory research. They are not approved for human or veterinary use by any regulatory authority. Using research peptides in humans carries serious and unpredictable health risks. By completing an order, purchasers confirm they are acquiring compounds for legitimate research purposes only.",
      },
      {
        q: "Do you sell reconstitution supplies?",
        a: "Yes — bacteriostatic water is available as a separate research supply. We don't provide reconstitution technique, dosing, or administration instructions; that falls under your own institution's standard operating procedures and safety protocols.",
      },
    ],
  },
  {
    category: "Returns",
    items: [
      {
        q: "What is your return policy?",
        a: "Due to the nature of research compounds, returns are not accepted once a vial has been opened or reconstituted. Unopened vials in original sealed condition may be eligible for return within 7 days of receipt — contact support@anvilcompounds.shop. Replacements are provided for verified transit damage or fulfillment errors.",
      },
    ],
  },
];
