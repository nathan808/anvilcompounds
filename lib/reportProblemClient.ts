// Client-safe report-a-problem helpers shared by ReportProblemTab
// (components/AccountDashboard.tsx, authenticated) and GuestReportProblem
// (components/GuestReportProblem.tsx, order number + tracking number) —
// deliberately separate from lib/reportProblem.ts, which holds the
// server-only email/WC-note logic that has no reason to ship to the client.

export const ISSUE_TYPES: { value: string; label: string }[] = [
  { value: "wrong_item", label: "Wrong item received" },
  { value: "lost_or_never_arrived", label: "Package lost or never arrived" },
  { value: "order_status", label: "Where is my order · order status" },
  { value: "add_item", label: "Add an item to my order" },
  { value: "damaged", label: "Damaged arrival" },
  { value: "coa_verification", label: "COA verification question" },
  { value: "other", label: "Other" },
];

// Keep in sync with MAX_PHOTO_BYTES in lib/reportProblem.ts.
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is "data:<mime>;base64,<data>" — Resend's attachments
      // API wants just the base64 payload.
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
