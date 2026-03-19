import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

const DOCUMENT_LABELS: Record<string, string> = {
  ITR: "Income Tax Return",
  BIRTH_CERT: "Birth Certificate",
  GOOD_MORAL: "Good Moral Certificate",
  TOR: "Transcript of Records",
  FORM_137: "Form 137 / School Records",
  BARANGAY_CERT: "Barangay Certificate",
  SKETCH_HOME: "Sketch of Home Location",
  ESSAY: "Application Essay",
  OFW_DOCS: "OFW POEA/DMW Records",
  "4PS_CERT": "4Ps/Listahanan Certificate",
};

interface ScholarshipDetail {
  id: number;
  title: string;
  provider: string;
  description: string;
  link: string | null;
  provider_type?: string | null;
  scholarship_type?: string | null;
  eligible_levels?: string[];
  eligible_regions?: string[];
  eligible_cities?: string[];
  eligible_school_types?: string[];
  eligible_courses_psced?: string[];
  max_income_threshold?: number | null;
  min_gwa_normalized?: number | null;
  min_age?: number | null;
  max_age?: number | null;
  benefit_tuition?: boolean;
  benefit_allowance_monthly?: number | null;
  benefit_books?: boolean;
  benefit_total_value?: number | null;
  required_documents?: string[];
  has_qualifying_exam?: boolean;
  has_interview?: boolean;
  has_essay_requirement?: boolean;
  has_return_service?: boolean;
  application_deadline?: string | null;
  application_open_date?: string | null;
  academic_year_target?: string | null;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return String(d);
  }
}

export function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState<ScholarshipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid scholarship");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(`/api/v1/scholarships/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Scholarship not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setScholarship(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12">
            <div className="h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-6 h-4 w-full rounded bg-slate-100 dark:bg-slate-700" />
            <div className="mt-2 h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-700" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !scholarship) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700">{error || "Scholarship not found"}</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              Go back
            </button>
          </div>
        </div>
      </section>
    );
  }

  const regions = scholarship.eligible_regions ?? [];
  const isNationwide = regions.length === 0 && !(scholarship.eligible_cities?.length);
  const hasLink = scholarship.link && scholarship.link.trim().startsWith("http");

  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          ← Back to results
        </button>

        <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-md">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {scholarship.provider_type && (
                <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {scholarship.provider_type}
                </span>
              )}
              {scholarship.scholarship_type && (
                <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {scholarship.scholarship_type}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{scholarship.title}</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{scholarship.provider}</p>
          </div>

          {scholarship.description && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Overview</h2>
              <p className="mt-2 text-slate-700 dark:text-slate-300">{scholarship.description}</p>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Eligibility Summary</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {scholarship.eligible_levels?.length ? (
                <li>Education level: {scholarship.eligible_levels.join(", ")}</li>
              ) : null}
              {scholarship.eligible_school_types?.length ? (
                <li>School type: {scholarship.eligible_school_types.join(", ")}</li>
              ) : null}
              {scholarship.eligible_courses_psced?.length ? (
                <li>Field of study: {scholarship.eligible_courses_psced.join(", ")}</li>
              ) : null}
              {scholarship.min_gwa_normalized != null && (
                <li>Minimum GWA: {scholarship.min_gwa_normalized}%</li>
              )}
              {scholarship.max_income_threshold != null && (
                <li>Income ceiling: PHP {scholarship.max_income_threshold.toLocaleString()}/year</li>
              )}
              {(scholarship.min_age != null || scholarship.max_age != null) && (
                <li>
                  Age: {scholarship.min_age != null ? `Min ${scholarship.min_age}` : ""}
                  {scholarship.min_age != null && scholarship.max_age != null && " • "}
                  {scholarship.max_age != null ? `Max ${scholarship.max_age}` : ""}
                </li>
              )}
              {isNationwide ? (
                <li>Region: Nationwide</li>
              ) : scholarship.eligible_cities?.length ? (
                <li>City: {scholarship.eligible_cities.join(", ")}</li>
              ) : regions.length ? (
                <li>Region: {regions.join(", ")}</li>
              ) : null}
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Benefits</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {scholarship.benefit_tuition && <li>Tuition coverage</li>}
              {scholarship.benefit_allowance_monthly != null && scholarship.benefit_allowance_monthly > 0 && (
                <li>Monthly allowance: ₱{scholarship.benefit_allowance_monthly.toLocaleString()}</li>
              )}
              {scholarship.benefit_books && <li>Books allowance</li>}
              {scholarship.benefit_total_value != null && scholarship.benefit_total_value > 0 && (
                <li className="font-medium text-primary-700 dark:text-primary-400">
                  Total value: up to ₱{scholarship.benefit_total_value.toLocaleString()}/year
                </li>
              )}
              {!scholarship.benefit_tuition &&
                !scholarship.benefit_allowance_monthly &&
                !scholarship.benefit_books &&
                (!scholarship.benefit_total_value || scholarship.benefit_total_value === 0) && (
                  <li className="text-slate-500 dark:text-slate-400">See official website for details</li>
                )}
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Requirements</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {scholarship.has_qualifying_exam && <li>Qualifying exam</li>}
              {scholarship.has_interview && <li>Interview</li>}
              {scholarship.has_essay_requirement && <li>Application essay</li>}
              {scholarship.has_return_service && <li>Return service obligation</li>}
            </ul>
            {scholarship.required_documents && scholarship.required_documents.length > 0 && (
              <div className="mt-3">
                <h3 className="text-xs font-medium text-slate-600 dark:text-slate-400">Documents required</h3>
                <ul className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                  {scholarship.required_documents.map((doc) => (
                    <li key={doc}>
                      {DOCUMENT_LABELS[doc] || doc.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Timeline</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {scholarship.application_open_date && (
                <li>Opens: {formatDate(scholarship.application_open_date)}</li>
              )}
              {scholarship.application_deadline && (
                <li>Deadline: {formatDate(scholarship.application_deadline)}</li>
              )}
              {scholarship.academic_year_target && (
                <li>Academic year: {scholarship.academic_year_target}</li>
              )}
              {!scholarship.application_open_date &&
                !scholarship.application_deadline &&
                !scholarship.academic_year_target && (
                  <li className="text-slate-500 dark:text-slate-400">Check official website for dates</li>
                )}
            </ul>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Apply</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Applications are submitted through the official scholarship provider website.
            </p>
            {hasLink ? (
              <a
                href={scholarship.link!}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Apply Now →
              </a>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Official link not available. Search for the provider online.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
