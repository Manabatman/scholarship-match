import { Link } from "react-router-dom";
import type { ScholarshipInfo } from "../types";
import { BookmarkButton } from "./BookmarkButton";

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

interface ScholarshipDetailPanelProps {
  scholarship: ScholarshipInfo & {
    eligible_levels?: string[];
    eligible_regions?: string[];
    eligible_cities?: string[];
    eligible_school_types?: string[];
    eligible_courses_psced?: string[];
    max_income_threshold?: number | null;
    min_gwa_normalized?: number | null;
    required_documents?: string[];
    has_qualifying_exam?: boolean;
    has_interview?: boolean;
    has_essay_requirement?: boolean;
    has_return_service?: boolean;
    application_open_date?: string | null;
    academic_year_target?: string | null;
  };
  onClose: () => void;
  isOpen: boolean;
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

export function ScholarshipDetailPanel({ scholarship, onClose, isOpen }: ScholarshipDetailPanelProps) {
  const regions = (scholarship as { eligible_regions?: string[] }).eligible_regions ?? scholarship.regions ?? [];
  const eligibleCities = (scholarship as { eligible_cities?: string[] }).eligible_cities ?? [];
  const isNationwide = regions.length === 0 && eligibleCities.length === 0;
  const hasLink = scholarship.link && scholarship.link.trim().startsWith("http");
  const s = scholarship as ScholarshipDetailPanelProps["scholarship"];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
          <h2 id="panel-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Scholarship Details
          </h2>
          <div className="flex items-center gap-1">
            <BookmarkButton scholarshipId={scholarship.id} />
            <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label="Close panel"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
        </div>

        <div className="p-4 pb-8">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {s.provider_type && (
                <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {s.provider_type}
                </span>
              )}
              {s.scholarship_type && (
                <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {s.scholarship_type}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{scholarship.title}</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{scholarship.provider}</p>
          </div>

          {scholarship.description && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Overview
              </h4>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{scholarship.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Eligibility Summary
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {s.eligible_levels?.length ? (
                <li>Education level: {s.eligible_levels.join(", ")}</li>
              ) : null}
              {s.eligible_school_types?.length ? (
                <li>School type: {s.eligible_school_types.join(", ")}</li>
              ) : null}
              {s.eligible_courses_psced?.length ? (
                <li>Field of study: {s.eligible_courses_psced.join(", ")}</li>
              ) : null}
              {s.min_gwa_normalized != null && (
                <li>Minimum GWA: {s.min_gwa_normalized}%</li>
              )}
              {s.max_income_threshold != null && (
                <li>Income ceiling: PHP {s.max_income_threshold.toLocaleString()}/year</li>
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
              ) : eligibleCities.length ? (
                <li>City: {eligibleCities.join(", ")}</li>
              ) : regions.length ? (
                <li>Region: {regions.join(", ")}</li>
              ) : null}
            </ul>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Benefits
            </h4>
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

          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Requirements
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {s.has_qualifying_exam && <li>Qualifying exam</li>}
              {s.has_interview && <li>Interview</li>}
              {s.has_essay_requirement && <li>Application essay</li>}
              {s.has_return_service && <li>Return service obligation</li>}
            </ul>
            {s.required_documents && s.required_documents.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-slate-600 dark:text-slate-400">Documents required</h5>
                <ul className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                  {s.required_documents.map((doc) => (
                    <li key={doc}>
                      {DOCUMENT_LABELS[doc] || doc.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Timeline
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {s.application_open_date && (
                <li>Opens: {formatDate(s.application_open_date)}</li>
              )}
              {scholarship.application_deadline && (
                <li>Deadline: {formatDate(scholarship.application_deadline)}</li>
              )}
              {s.academic_year_target && (
                <li>Academic year: {s.academic_year_target}</li>
              )}
              {!s.application_open_date &&
                !scholarship.application_deadline &&
                !s.academic_year_target && (
                  <li className="text-slate-500 dark:text-slate-400">Check official website for dates</li>
                )}
            </ul>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-3">
            <Link
              to={`/scholarship/${scholarship.id}`}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition"
            >
              View Full Page
            </Link>
            {hasLink ? (
              <a
                href={scholarship.link!}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Apply Now →
              </a>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Official link not available. Search for the provider online.
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
