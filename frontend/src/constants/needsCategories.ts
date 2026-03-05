/**
 * PSCED-aligned field-of-study taxonomy and RA-based equity groups.
 * Used for matching students with scholarships.
 */

/** PSCED broad disciplines (field of study) */
export const PSCED_FIELD_OF_STUDY = [
  { label: "Field of Study", tags: ["STEM", "Engineering", "IT", "Medical", "Business", "Education", "Agriculture", "Arts", "Law", "Architecture"] },
] as const;

/** Type of aid (informational) */
export const TYPE_OF_AID = [
  { label: "Type of Aid", tags: ["Financial Aid", "Merit-based", "Housing", "Books", "Vocational/TVET"] },
] as const;

/** RA-based equity groups (Philippine legislative priority groups) */
export const EQUITY_GROUPS = [
  {
    label: "Priority Groups (RA-based)",
    tags: [
      { id: "Underprivileged", label: "Underprivileged / Homeless", ra: "RA 7279" },
      { id: "PWD", label: "Person with Disability", ra: "RA 7277" },
      { id: "IP", label: "Indigenous Peoples", ra: "RA 8371" },
      { id: "Solo Parent Dependent", label: "Solo Parent Dependent", ra: "RA 11861" },
      { id: "OFW Dependent", label: "OFW Dependent", ra: "OWWA" },
      { id: "Farmer/Fisher Dependent", label: "Farmer/Fisher Dependent", ra: "Landbank" },
      { id: "4Ps/Listahanan", label: "4Ps / Listahanan 2.0", ra: "Pantawid" },
    ],
  },
] as const;

/** Philippine income brackets (PHP annual) */
export const INCOME_BRACKETS = [
  { value: "below_250k", label: "Below PHP 250,000" },
  { value: "250k_400k", label: "PHP 250,001 - 400,000" },
  { value: "400k_500k", label: "PHP 400,001 - 500,000" },
  { value: "above_500k", label: "Above PHP 500,000" },
] as const;

/** Legacy: flat needs for backward compatibility */
export const NEEDS_CATEGORIES = [
  {
    label: "Field of Study",
    tags: ["STEM", "Engineering", "Science", "IT", "Medical", "Arts", "Business", "Education", "Agriculture"],
  },
  {
    label: "Type of Aid",
    tags: ["Financial Aid", "Merit-based", "Housing", "Books", "Vocational/TVET"],
  },
  {
    label: "Personal Background",
    tags: ["Underprivileged", "First-gen", "OFW Dependent", "GSIS Dependent", "Athletics", "Leadership"],
  },
] as const;
