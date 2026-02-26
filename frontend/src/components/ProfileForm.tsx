import { FormEvent, useState } from "react";

interface ProfileFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

const REQUIRED_FIELDS = [
  "full_name",
  "email",
  "age",
  "region",
  "school",
  "needs"
] as const;

function countFilledFields(values: Record<string, string>): number {
  let count = 0;
  if ((values.full_name ?? "").trim().length > 0) count++;
  if ((values.email ?? "").trim().length > 0) count++;
  if ((values.age ?? "").trim().length > 0 && Number(values.age) > 0) count++;
  if ((values.region ?? "").trim().length > 0) count++;
  if ((values.school ?? "").trim().length > 0) count++;
  const needsStr = (values.needs ?? "").trim();
  if (needsStr.length > 0 && needsStr.split(",").some((n) => n.trim().length > 0))
    count++;
  return count;
}

export function ProfileForm({ onSubmit, loading, error }: ProfileFormProps) {
  const [values, setValues] = useState<Record<string, string>>({
    full_name: "",
    email: "",
    age: "",
    region: "",
    school: "",
    needs: ""
  });

  const filledCount = countFilledFields(values);
  const strengthPercent = Math.round((filledCount / REQUIRED_FIELDS.length) * 100);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section id="profile" className="py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              Build Your Profile
            </h2>
            <span className="text-sm text-slate-500">Step 1 of 2</span>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Profile Strength</span>
              <span className="text-slate-500">{strengthPercent}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-300"
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="grid gap-6 sm:grid-cols-2 sm:gap-8"
          >
            <div className="space-y-4 sm:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Personal Info
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Full name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={values.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="e.g. Maria Santos"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={values.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="maria@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-slate-700"
                  >
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
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="18"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Academic Info
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="school"
                    className="block text-sm font-medium text-slate-700"
                  >
                    School
                  </label>
                  <input
                    id="school"
                    name="school"
                    type="text"
                    required
                    value={values.school}
                    onChange={(e) => handleChange("school", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="Current or target school"
                  />
                </div>
                <div>
                  <label
                    htmlFor="region"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Region
                  </label>
                  <input
                    id="region"
                    name="region"
                    type="text"
                    required
                    value={values.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="e.g. NCR, Visayas, Mindanao"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Needs & Background
              </h3>
              <div>
                <label
                  htmlFor="needs"
                  className="block text-sm font-medium text-slate-700"
                >
                  Needs / tags
                </label>
                <textarea
                  id="needs"
                  name="needs"
                  rows={3}
                  value={values.needs}
                  onChange={(e) => handleChange("needs", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  placeholder="Comma-separated, e.g. financial, housing, STEM, first-gen"
                />
                <p className="mt-1 text-xs text-slate-500">
                  We use these tags to match you with relevant scholarships.
                </p>
              </div>
            </div>

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
              <p className="text-xs text-slate-500">
                We only store minimal data needed for matching.
              </p>
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
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
