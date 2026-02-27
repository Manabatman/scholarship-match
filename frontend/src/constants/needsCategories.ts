/**
 * Needs/tags grouped by category for the accordion UI.
 * Used for matching students with scholarships.
 */
export const NEEDS_CATEGORIES = [
  {
    label: "Field of Study",
    tags: [
      "STEM",
      "Engineering",
      "Science",
      "IT",
      "Medical",
      "Arts",
      "Business",
      "Education",
      "Agriculture",
    ],
  },
  {
    label: "Type of Aid",
    tags: [
      "Financial Aid",
      "Merit-based",
      "Housing",
      "Books",
      "Vocational/TVET",
    ],
  },
  {
    label: "Personal Background",
    tags: [
      "Underprivileged",
      "First-gen",
      "OFW Dependent",
      "GSIS Dependent",
      "Athletics",
      "Leadership",
    ],
  },
] as const;
