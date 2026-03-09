import { useState } from "react";
import { Link } from "react-router-dom";
import type { MatchResult } from "../types";

function getScoreBadgeClasses(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  if (score >= 70) return "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
}

function getUrgencyLevel(
  deadline: string | null | undefined,
  openDate?: string | null
): { level: string; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (openDate) {
    try {
      const open = new Date(openDate);
      open.setHours(0, 0, 0, 0);
      const daysUntilOpen = Math.ceil((open.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilOpen > 0) {
        if (daysUntilOpen <= 7) return { level: "upcoming", label: `Opens in ${daysUntilOpen}d` };
        return { level: "upcoming", label: "Opens soon" };
      }
    } catch {
      /* ignore */
    }
  }

  if (!deadline) return { level: "unknown", label: "No deadline" };
  try {
    const d = new Date(deadline);
    d.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { level: "closed", label: "Closed" };
    if (daysLeft <= 3) return { level: "critical", label: `Closes in ${daysLeft}d` };
    if (daysLeft <= 7) return { level: "urgent", label: `Closes in ${daysLeft}d` };
    if (daysLeft <= 30) return { level: "soon", label: "Closing Soon" };
    return { level: "open", label: "Open" };
  } catch {
    return { level: "unknown", label: "No deadline" };
  }
}

function getUrgencyBadgeClasses(level: string): string {
  switch (level) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "urgent":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "soon":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    case "open":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "closed":
      return "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-400";
    case "upcoming":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "met":
    case "exceeded":
    case "ready":
      return <span className="text-green-600" aria-label="Met">✓</span>;
    case "partial":
      return <span className="text-amber-600" aria-label="Partial">◐</span>;
    case "missing":
    case "disqualified":
      return <span className="text-red-600" aria-label="Missing">✗</span>;
    default:
      return <span className="text-slate-400">—</span>;
  }
}

interface ScholarshipCardProps {
  match: MatchResult;
}

export function ScholarshipCard({ match }: ScholarshipCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const score = match.final_score ?? match.score;
  const scoreBadgeClasses = getScoreBadgeClasses(score);
  const link = match.link && match.link.trim() ? match.link : "#";
  const hasLink = !!link && link.startsWith("http");
  const regions = (match.regions ?? []).map((r) => r.trim()).filter(Boolean);
  const urgency = getUrgencyLevel(match.application_deadline, match.application_open_date);
  const urgencyBadgeClasses = getUrgencyBadgeClasses(urgency.level);

  return (
    <article
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
      aria-labelledby={`scholarship-title-${match.id}`}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`scholarship-title-${match.id}`}
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {match.title}
              </h3>
              {match.provider_type && (
                <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {match.provider_type}
                </span>
              )}
              {match.scholarship_type && (
                <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {match.scholarship_type}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{match.provider}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scoreBadgeClasses}`}>
              {Math.round(score)}% match
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgencyBadgeClasses}`}>
              {urgency.label}
            </span>
          </div>
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-slate-700 dark:text-slate-300">
          {match.description || "No description available."}
        </p>

        {/* Benefit icons */}
        {(match.benefit_tuition || match.benefit_allowance_monthly || match.benefit_books || match.benefit_total_value) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
            {match.benefit_tuition && (
              <span className="flex items-center gap-1" title="Tuition">
                <span aria-hidden>🎓</span> Tuition
              </span>
            )}
            {match.benefit_allowance_monthly != null && match.benefit_allowance_monthly > 0 && (
              <span className="flex items-center gap-1" title="Monthly allowance">
                <span aria-hidden>💰</span> ₱{match.benefit_allowance_monthly.toLocaleString()}/mo
              </span>
            )}
            {match.benefit_books && (
              <span className="flex items-center gap-1" title="Books">
                <span aria-hidden>📚</span> Books
              </span>
            )}
            {match.benefit_total_value != null && match.benefit_total_value > 0 && (
              <span className="font-medium text-primary-700 dark:text-primary-400">
                Up to ₱{match.benefit_total_value.toLocaleString()}/yr
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1">
          {regions.length === 0 ? (
            <span className="rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
              Nationwide
            </span>
          ) : (
            <>
              {regions.slice(0, 4).map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  {r}
                </span>
              ))}
              {regions.length > 4 && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                  +{regions.length - 4} more
                </span>
              )}
            </>
          )}
        </div>

        {(match.min_age != null || match.max_age != null) && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Age: {match.min_age != null ? `Min ${match.min_age}` : ""}
            {match.min_age != null && match.max_age != null && " • "}
            {match.max_age != null ? `Max ${match.max_age}` : ""}
          </p>
        )}

        {/* Why You Matched - expandable breakdown */}
        {(match.breakdown || (match.explanation && match.explanation.length > 0)) && (
          <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded"
              aria-expanded={showBreakdown}
            >
              Why you matched
              <svg
                className={`h-4 w-4 transition-transform ${showBreakdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showBreakdown && (
              <div className="mt-2 space-y-3">
                {match.breakdown && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Your Match Breakdown</p>
                    {Object.entries(match.breakdown).map(([key, factor]) => {
                      if (!factor || typeof factor !== "object") return null;
                      const f = factor as { status?: string; user_value?: string; requirement_value?: string };
                      const labels: Record<string, string> = {
                        academic: "Academic (GWA)",
                        socioeconomic: "Financial Eligibility",
                        field_relevance: "Course Alignment",
                        geographic: "Region Match",
                        priority_group: "Priority Group",
                      };
                      const label = labels[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <span className="mt-0.5 shrink-0">
                            <StatusIcon status={(f.status ?? "").toLowerCase()} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                            <p className="text-slate-600 dark:text-slate-400">
                              Your data: {f.user_value ?? "—"} • Requirement: {f.requirement_value ?? "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {match.explanation && match.explanation.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    {match.explanation.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to={`/scholarship/${match.id}`}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={`View details for ${match.title}`}
        >
          View Details
        </Link>
        {hasLink ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={`Apply now for ${match.title}`}
          >
            Apply Now
          </a>
        ) : (
          <span className="rounded-lg bg-slate-200 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed">
            Link unavailable
          </span>
        )}
      </div>
    </article>
  );
}
