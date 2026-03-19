import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AutocompleteInput } from "./AutocompleteInput";
import { NeedsCategoryAccordion } from "./NeedsCategoryAccordion";
import { SelectedChips } from "./SelectedChips";
import { NEEDS_CATEGORIES, EQUITY_GROUPS, INCOME_BRACKETS } from "../constants/needsCategories";
import { PHILIPPINE_REGIONS } from "../constants/regions";

const PROFILE_DRAFT_KEY = "iskonnect_profile_draft";

interface ProfileFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  initialValues?: Record<string, string>;
}

const STEPS = 5;
const EDUCATION_LEVELS = [
  { value: "", label: "Select education level" },
  { value: "Grade 11", label: "Grade 11" },
  { value: "Grade 12", label: "Grade 12" },
  { value: "High School", label: "High School" },
  { value: "College", label: "College" },
  { value: "TVET", label: "TVET" },
  { value: "Graduate", label: "Graduate" },
] as const;

const ACADEMIC_STAGES = [
  { value: "", label: "Select stage" },
  { value: "Junior HS", label: "Junior High School" },
  { value: "Senior HS", label: "Senior High School" },
  { value: "Undergraduate", label: "College Undergraduate" },
  { value: "Postgraduate", label: "Postgraduate" },
  { value: "TVET", label: "TVET" },
  { value: "ALS", label: "ALS Completer" },
] as const;

const SCHOOL_TYPES = [
  { value: "", label: "Select" },
  { value: "Public", label: "Public" },
  { value: "Private", label: "Private" },
] as const;

const GWA_SCALES = [
  { value: "", label: "Select scale" },
  { value: "percentage", label: "Percentage (0-100)" },
  { value: "5.0_scale", label: "5.0 Scale (1.0 highest)" },
  { value: "4.0_scale", label: "4.0 Scale (4.0 highest)" },
] as const;

const EQUITY_FLAG_MAP: Record<string, string> = {
  Underprivileged: "is_underprivileged",
  PWD: "is_pwd",
  IP: "is_indigenous_people",
  "Solo Parent Dependent": "is_solo_parent_dependent",
  "OFW Dependent": "is_ofw_dependent",
  "Farmer/Fisher Dependent": "is_farmer_fisher_dependent",
  "4Ps/Listahanan": "is_4ps_listahanan",
};

const TIER1_FIELDS: { key: string; step: number; label: string }[] = [
  { key: "full_name", step: 1, label: "Full name" },
  { key: "email", step: 1, label: "Email" },
  { key: "age", step: 1, label: "Age" },
  { key: "education_level", step: 2, label: "Education level" },
  { key: "region", step: 3, label: "Region" },
];

const TIER2_FIELDS: { key: string; label: string }[] = [
  { key: "field_of_study_broad", label: "Field of study" },
  { key: "school_type", label: "School type" },
  { key: "household_income_annual", label: "Household income or income bracket" },
];

const DEFAULT_VALUES: Record<string, string> = {
  full_name: "",
  email: "",
  age: "",
  gender: "",
  region: "",
  province: "",
  city_municipality: "",
  barangay: "",
  school: "",
  school_type: "",
  target_school: "",
  education_level: "",
  current_academic_stage: "",
  target_academic_year: "",
  field_of_study_broad: "",
  field_of_study_specific: "",
  preferred_course_1: "",
  preferred_course_2: "",
  preferred_course_3: "",
  gwa_raw: "",
  gwa_scale: "",
  needs: "",
  extracurriculars: "",
  awards: "",
  household_income_annual: "",
  income_bracket: "",
  is_underprivileged: "",
  is_pwd: "",
  is_indigenous_people: "",
  is_solo_parent_dependent: "",
  is_ofw_dependent: "",
  is_farmer_fisher_dependent: "",
  is_4ps_listahanan: "",
  parent_occupation: "",
};

export function ProfileForm({ onSubmit, loading, error, initialValues }: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showRecommendedDialog, setShowRecommendedDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<FormEvent<HTMLFormElement> | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      return { ...DEFAULT_VALUES, ...initialValues };
    }
    try {
      const stored = localStorage.getItem(PROFILE_DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        return { ...DEFAULT_VALUES, ...parsed };
      }
    } catch {
      // ignore parse errors
    }
    return { ...DEFAULT_VALUES };
  });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setValues((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  useEffect(() => {
    const saveDraft = () => {
      try {
        localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(values));
      } catch {
        // ignore quota errors
      }
    };
    saveTimeoutRef.current = setTimeout(saveDraft, 400);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [values]);

  const selectedNeeds = (values.needs ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  const toggleNeed = (tag: string) => {
    const next = selectedNeeds.includes(tag)
      ? selectedNeeds.filter((t) => t !== tag)
      : [...selectedNeeds, tag];
    setValues((prev) => ({ ...prev, needs: next.join(", ") }));
  };

  const handleChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const toggleEquity = (flagName: string) => {
    const current = values[flagName] === "on";
    setValues((prev) => ({ ...prev, [flagName]: current ? "" : "on" }));
  };

  const getVal = (k: string) => (values[k] ?? "").trim();
  const hasIncome = () => {
    const income = getVal("household_income_annual");
    const bracket = getVal("income_bracket");
    return !!income || !!bracket;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors({});

    const tier1Missing = TIER1_FIELDS.filter((f) => !getVal(f.key));
    if (tier1Missing.length > 0) {
      const errs: Record<string, string> = {};
      tier1Missing.forEach((f) => {
        errs[f.key] = `${f.label} is required`;
      });
      setValidationErrors(errs);
      const firstStep = Math.min(...tier1Missing.map((f) => f.step));
      setStep(firstStep);
      return;
    }

    const tier2Missing = TIER2_FIELDS.filter((f) => {
      if (f.key === "household_income_annual") return !hasIncome();
      return !getVal(f.key);
    });
    if (tier2Missing.length > 0) {
      setShowRecommendedDialog(true);
      setPendingSubmit(e);
      return;
    }

    onSubmit(e);
  };

  const confirmSubmitAnyway = () => {
    setShowRecommendedDialog(false);
    if (pendingSubmit) {
      onSubmit(pendingSubmit);
      setPendingSubmit(null);
    }
  };

  const cancelRecommendedDialog = () => {
    setShowRecommendedDialog(false);
    setPendingSubmit(null);
  };

  const strengthPercent = Math.round((step / STEPS) * 100);

  return (
    <section id="profile" className="py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Build Your Profile</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Step {step} of {STEPS}
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
              <span className="text-slate-500 dark:text-slate-400">{strengthPercent}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-300"
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>

          {showRecommendedDialog && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-labelledby="recommended-dialog-title"
              aria-modal="true"
            >
              <div className="max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl">
                <h3 id="recommended-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Some important fields are empty
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Your matches may be less accurate. Missing: field of study, school type, or income information.
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  You can still continue — we will show you the best matches we can with the information provided.
                </p>
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={cancelRecommendedDialog}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                  >
                    Go back and fill in
                  </button>
                  <button
                    type="button"
                    onClick={confirmSubmitAnyway}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    Continue anyway
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            {/* Step 1: Personal Identity */}
            {step === 1 && (
              <div className="space-y-4 sm:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Personal Identity & Contact
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Full name
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={values.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      className={`mt-1 w-full rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 ${validationErrors.full_name ? "border-red-500" : "border-slate-300 dark:border-slate-600 focus:border-primary-500"}`}
                      placeholder="e.g. Maria Santos"
                    />
                    {validationErrors.full_name && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.full_name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={values.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`mt-1 w-full rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 ${validationErrors.email ? "border-red-500" : "border-slate-300 dark:border-slate-600 focus:border-primary-500"}`}
                      placeholder="maria@example.com"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={values.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Age
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      min={13}
                      max={120}
                      required
                      value={values.age}
                      onChange={(e) => handleChange("age", e.target.value)}
                      className={`mt-1 w-full rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 ${validationErrors.age ? "border-red-500" : "border-slate-300 dark:border-slate-600 focus:border-primary-500"}`}
                      placeholder="18"
                    />
                    {validationErrors.age && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.age}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Academic Trajectory */}
            {step === 2 && (
              <div className="space-y-4 sm:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Academic Trajectory
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="current_academic_stage" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Current academic stage
                    </label>
                    <select
                      id="current_academic_stage"
                      name="current_academic_stage"
                      value={values.current_academic_stage}
                      onChange={(e) => handleChange("current_academic_stage", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                      {ACADEMIC_STAGES.map((opt) => (
                        <option key={opt.value || "empty"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="education_level" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Education level
                    </label>
                    <select
                      id="education_level"
                      name="education_level"
                      value={values.education_level}
                      onChange={(e) => handleChange("education_level", e.target.value)}
                      className={`mt-1 w-full rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 ${validationErrors.education_level ? "border-red-500" : "border-slate-300 dark:border-slate-600 focus:border-primary-500"}`}
                    >
                      {EDUCATION_LEVELS.map((opt) => (
                        <option key={opt.value || "empty"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {validationErrors.education_level && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.education_level}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="target_academic_year" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Target academic year
                    </label>
                    <input
                      id="target_academic_year"
                      name="target_academic_year"
                      type="text"
                      value={values.target_academic_year}
                      onChange={(e) => handleChange("target_academic_year", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="e.g. 2026-2027"
                    />
                  </div>
                  <div>
                    <AutocompleteInput
                      id="school"
                      name="school"
                      label="School"
                      value={values.school}
                      onChange={handleChange}
                      endpoint="/api/v1/suggestions/schools"
                      placeholder="Current or target school"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="school_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      What type of school do you currently attend?
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Select whether your current school is public or private. Some scholarships are only available to students from public schools.
                    </p>
                    <select
                      id="school_type"
                      name="school_type"
                      value={values.school_type}
                      onChange={(e) => handleChange("school_type", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                      {SCHOOL_TYPES.map((opt) => (
                        <option key={opt.value || "empty"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <AutocompleteInput
                      id="target_school"
                      name="target_school"
                      label="Target university (if applicable)"
                      value={values.target_school}
                      onChange={handleChange}
                      endpoint="/api/v1/suggestions/schools"
                      placeholder="e.g. UP Diliman"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="field_of_study_broad" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Field of study (broad)
                    </label>
                    <select
                      id="field_of_study_broad"
                      name="field_of_study_broad"
                      value={values.field_of_study_broad}
                      onChange={(e) => handleChange("field_of_study_broad", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="">Select</option>
                      <optgroup label="STEM (Science, Technology, Engineering, Math)">
                        <option value="STEM">STEM</option>
                        <option value="Engineering">Engineering</option>
                        <option value="IT">IT / Computer Science</option>
                        <option value="Science">Natural Sciences</option>
                        <option value="Mathematics">Mathematics / Statistics</option>
                      </optgroup>
                      <optgroup label="Other fields">
                        <option value="Medical">Medical / Health Sciences</option>
                        <option value="Business">Business / Accountancy</option>
                        <option value="Education">Education</option>
                        <option value="Agriculture">Agriculture / Forestry</option>
                        <option value="Arts">Arts / Humanities</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Geographic */}
            {step === 3 && (
              <div className="space-y-4 sm:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Geographic Specificity
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Region
                    </label>
                    <select
                      id="region"
                      name="region"
                      required
                      value={values.region}
                      onChange={(e) => handleChange("region", e.target.value)}
                      className={`mt-1 w-full rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 ${validationErrors.region ? "border-red-500" : "border-slate-300 dark:border-slate-600 focus:border-primary-500"}`}
                    >
                      <option value="">Select your region</option>
                      {PHILIPPINE_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {validationErrors.region && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.region}</p>
                    )}
                  </div>
                  <div>
                    <AutocompleteInput
                      id="province"
                      name="province"
                      label="Province"
                      value={values.province}
                      onChange={handleChange}
                      endpoint="/api/v1/suggestions/provinces"
                      placeholder="e.g. Metro Manila"
                      extraParams={values.region ? { region: values.region } : {}}
                    />
                  </div>
                  <div>
                    <label htmlFor="city_municipality" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      City / Municipality
                    </label>
                    <input
                      id="city_municipality"
                      name="city_municipality"
                      type="text"
                      value={values.city_municipality}
                      onChange={(e) => handleChange("city_municipality", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="e.g. Quezon City"
                    />
                  </div>
                  <div>
                    <label htmlFor="barangay" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Barangay
                    </label>
                    <input
                      id="barangay"
                      name="barangay"
                      type="text"
                      value={values.barangay}
                      onChange={(e) => handleChange("barangay", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Academic Merit */}
            {step === 4 && (
              <div className="space-y-4 sm:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Academic Merit & Interests
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Preferred courses (up to 3)
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      List the courses you want to pursue. We will match scholarships that support any of them.
                    </p>
                    <div className="mt-2 space-y-2">
                      {[1, 2, 3].map((i) => (
                        <AutocompleteInput
                          key={i}
                          id={`preferred_course_${i}`}
                          name={`preferred_course_${i}`}
                          value={values[`preferred_course_${i}` as keyof typeof values] ?? ""}
                          onChange={handleChange}
                          endpoint="/api/v1/suggestions/courses"
                          placeholder={i === 1 ? "e.g. BS Computer Science" : `Course ${i} (optional)`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gwa_raw" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      GWA / Grade
                    </label>
                    <input
                      id="gwa_raw"
                      name="gwa_raw"
                      type="text"
                      value={values.gwa_raw}
                      onChange={(e) => handleChange("gwa_raw", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="e.g. 95 or 1.25"
                    />
                  </div>
                  <div>
                    <label htmlFor="gwa_scale" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Grading scale
                    </label>
                    <select
                      id="gwa_scale"
                      name="gwa_scale"
                      value={values.gwa_scale}
                      onChange={(e) => handleChange("gwa_scale", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                      {GWA_SCALES.map((opt) => (
                        <option key={opt.value || "empty"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="extracurriculars" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Extracurriculars (comma-separated)
                    </label>
                    <input
                      id="extracurriculars"
                      name="extracurriculars"
                      type="text"
                      value={values.extracurriculars}
                      onChange={(e) => handleChange("extracurriculars", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="e.g. Student Council, Science Club"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="awards" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Awards (comma-separated)
                    </label>
                    <input
                      id="awards"
                      name="awards"
                      type="text"
                      value={values.awards}
                      onChange={(e) => handleChange("awards", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="e.g. National Honor Society"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Needs / tags</label>
                    <input type="hidden" name="needs" value={values.needs} />
                    <div className="mt-2 space-y-3">
                      <SelectedChips
                        selected={selectedNeeds}
                        onRemove={toggleNeed}
                        emptyMessage="Expand a category below to select needs"
                      />
                      <NeedsCategoryAccordion
                        categories={NEEDS_CATEGORIES}
                        selected={selectedNeeds}
                        onToggle={toggleNeed}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Socio-Economic */}
            {step === 5 && (
              <div className="space-y-4 sm:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Socio-Economic & Priority Groups
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="household_income_annual" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Household income (PHP/year)
                    </label>
                    <input
                      id="household_income_annual"
                      name="household_income_annual"
                      type="number"
                      min={0}
                      value={values.household_income_annual}
                      onChange={(e) => handleChange("household_income_annual", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="e.g. 180000"
                    />
                  </div>
                  <div>
                    <label htmlFor="income_bracket" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Income bracket (if unsure)
                    </label>
                    <select
                      id="income_bracket"
                      name="income_bracket"
                      value={values.income_bracket}
                      onChange={(e) => handleChange("income_bracket", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="">Select</option>
                      {INCOME_BRACKETS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority groups (RA-based)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EQUITY_GROUPS[0].tags.map((tag) => {
                        const flagName = EQUITY_FLAG_MAP[tag.id] || tag.id;
                        const isChecked = values[flagName] === "on";
                        return (
                          <label
                            key={tag.id}
                            className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <input
                              type="checkbox"
                              name={flagName}
                              checked={isChecked}
                              onChange={() => toggleEquity(flagName)}
                              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span>{tag.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Select if you belong to any priority group for scholarship matching.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="parent_occupation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Parent occupation (optional)
                    </label>
                    <input
                      id="parent_occupation"
                      name="parent_occupation"
                      type="text"
                      value={values.parent_occupation}
                      onChange={(e) => handleChange("parent_occupation", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="e.g. GSIS member, OFW"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hidden fields for steps not shown */}
            {step !== 1 && (
              <>
                <input type="hidden" name="full_name" value={values.full_name} />
                <input type="hidden" name="email" value={values.email} />
                <input type="hidden" name="age" value={values.age} />
                <input type="hidden" name="gender" value={values.gender} />
              </>
            )}
            {step !== 2 && (
              <>
                <input type="hidden" name="school" value={values.school} />
                <input type="hidden" name="education_level" value={values.education_level} />
                <input type="hidden" name="current_academic_stage" value={values.current_academic_stage} />
                <input type="hidden" name="target_academic_year" value={values.target_academic_year} />
                <input type="hidden" name="school_type" value={values.school_type} />
                <input type="hidden" name="target_school" value={values.target_school} />
                <input type="hidden" name="field_of_study_broad" value={values.field_of_study_broad} />
              </>
            )}
            {step !== 3 && (
              <>
                <input type="hidden" name="region" value={values.region} />
                <input type="hidden" name="province" value={values.province} />
                <input type="hidden" name="city_municipality" value={values.city_municipality} />
                <input type="hidden" name="barangay" value={values.barangay} />
              </>
            )}
            {step !== 4 && (
              <>
                <input type="hidden" name="field_of_study_specific" value={values.field_of_study_specific} />
                <input type="hidden" name="preferred_course_1" value={values.preferred_course_1} />
                <input type="hidden" name="preferred_course_2" value={values.preferred_course_2} />
                <input type="hidden" name="preferred_course_3" value={values.preferred_course_3} />
                <input type="hidden" name="gwa_raw" value={values.gwa_raw} />
                <input type="hidden" name="gwa_scale" value={values.gwa_scale} />
                <input type="hidden" name="needs" value={values.needs} />
                <input type="hidden" name="extracurriculars" value={values.extracurriculars} />
                <input type="hidden" name="awards" value={values.awards} />
              </>
            )}
            {step !== 5 && (
              <>
                <input type="hidden" name="household_income_annual" value={values.household_income_annual} />
                <input type="hidden" name="income_bracket" value={values.income_bracket} />
                <input type="hidden" name="parent_occupation" value={values.parent_occupation} />
              </>
            )}
            {EQUITY_GROUPS[0].tags.map((tag) => {
              const flagName = EQUITY_FLAG_MAP[tag.id] || tag.id;
              return <input key={flagName} type="hidden" name={flagName} value={values[flagName] || ""} />;
            })}

            {error && (
              <div className="sm:col-span-2">
                <div
                  className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
                  role="alert"
                >
                  {error}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Back
                  </button>
                )}
                {step < STEPS && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Next
                  </button>
                )}
              </div>
              {step === STEPS && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={loading ? "Matching scholarships" : "Get My Matches"}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-primary-100 border-t-transparent"
                        aria-hidden
                      />
                      Matching...
                    </span>
                  ) : (
                    "Get My Matches"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
