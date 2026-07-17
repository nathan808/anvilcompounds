// Research institution taxonomy -- gate-only (see app/gate). Kept separate
// from lib/researchPurpose.ts, which asks what role the visitor has rather
// than what kind of organization they're with.
export const INSTITUTION_TYPES = [
  { value: "university",  label: "University / Academic" },
  { value: "private_lab", label: "Private / Independent Lab" },
  { value: "biotech",     label: "Biotech / Pharma" },
  { value: "cro",         label: "Contract Research Org (CRO)" },
  { value: "other",       label: "Other" },
] as const;

export type InstitutionTypeValue = (typeof INSTITUTION_TYPES)[number]["value"];

export const OTHER_INSTITUTION_TYPE: InstitutionTypeValue = "other";

export function isValidInstitutionType(value: string): value is InstitutionTypeValue {
  return INSTITUTION_TYPES.some((t) => t.value === value);
}
