// Shared researcher-classification taxonomy used by both the gate
// (app/gate) and account registration (app/account, app/api/auth/register).
// The two are independent selections — a visitor's gate answer is never
// checked against, or required to match, whatever they later pick when
// creating an account.
export const RESEARCH_PURPOSES = [
  { value: "scientist", label: "Scientist" },
  { value: "research_associate", label: "Research Associate" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "independent_researcher", label: "Independent Researcher" },
  { value: "other", label: "Other" },
] as const;

export type ResearchPurposeValue = (typeof RESEARCH_PURPOSES)[number]["value"];

export const OTHER_RESEARCH_PURPOSE: ResearchPurposeValue = "other";

export function isValidResearchPurpose(value: string): value is ResearchPurposeValue {
  return RESEARCH_PURPOSES.some((p) => p.value === value);
}
