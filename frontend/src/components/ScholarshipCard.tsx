import { useState } from "react";
import type { MatchResult } from "../types";

function getScoreBadgeClasses(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-primary-100 text-primary-800";
  if (score >= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-slate-100 text-slate-600";
}

function getUrgencyLevel(deadline: string | null | undefined): { level: string; label: string } {
  if (!deadline) return { level: "unknown", label: "No deadline" };
  try {
    const d = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      return "bg-red-100 text-red-800";
    case "urgent":
      return "bg-orange-100 text-orange-800";
    case "soon":
      return "bg-amber-100 text-amber-800";
    case "open":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
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
  const urgency = getUrgencyLevel(match.application_deadline);
  const urgencyBadgeClasses = getUrgencyBadgeClasses(urgency.level);

  return (
    <article
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
      aria-labelledby={`scholarship-title-${match.id}`}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`scholarship-title-${match.id}`}
                className="text-lg font-semibold text-slate-900"
              >
                {match.title}
              </h3>
              {match.provider_type && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {match.provider_type}
                </span>
              )}
              {match.scholarship_type && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {match.scholarship_type}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{match.provider}</p>
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

        <p className="mt-3 line-clamp-3 text-sm text-slate-700">
          {match.description || "No description available."}
        </p>

        {/* Benefit icons */}
        {(match.benefit_tuition || match.benefit_allowance_monthly || match.benefit_books || match.benefit_total_value) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
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
              <span className="font-medium text-primary-700">
                Up to ₱{match.benefit_total_value.toLocaleString()}/yr
              </span>
            )}
          </div>
        )}

        {/* Readiness indicator */}
        {match.readiness_score != null && match.required_documents && match.required_documents.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            Docs: {Math.round(match.readiness_score)}% ready ({match.required_documents.length} required)
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1">
          {regions.slice(0, 4).map((r) => (
            <span
              key={r}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            >
              {r}
            </span>
          ))}
          {regions.length > 4 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              +{regions.length - 4} more
            </span>
          )}
        </div>

        {(match.min_age != null || match.max_age != null) && (
          <p className="mt-2 text-xs text-slate-500">
            Age: {match.min_age != null ? `Min ${match.min_age}` : ""}
            {match.min_age != null && match.max_age != null && " • "}
            {match.max_age != null ? `Max ${match.max_age}` : ""}
          </p>
        )}

        {/* Why You Matched - expandable breakdown */}
        {(match.breakdown || (match.explanation && match.explanation.length > 0)) && (
          <div className="mt-3 border-t border-slate-200 pt-3">
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
              <div className="mt-2 space-y-2">
                {match.explanation && match.explanation.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                    {match.explanation.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
                {match.breakdown && (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Factor</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Your data</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Requirement</th>
                          <th className="px-3 py-2 text-center font-semibold text-slate-700 w-8">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(match.breakdown).map(([key, factor]) => {
                          if (!factor || typeof factor !== "object") return null;
                          const f = factor as { status?: string; user_value?: string; requirement_value?: string };
                          const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                          return (
                            <tr key={key} className="border-t border-slate-100">
                              <td className="px-3 py-2 text-slate-700">{label}</td>
                              <td className="px-3 py-2 text-slate-600">{f.user_value ?? "—"}</td>
                              <td className="px-3 py-2 text-slate-600">{f.requirement_value ?? "—"}</td>
                              <td className="px-3 py-2 text-center">
                                <StatusIcon status={(f.status ?? "").toLowerCase()} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={link}
          target={hasLink ? "_blank" : undefined}
          rel={hasLink ? "noreferrer" : undefined}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={`View details for ${match.title}`}
        >
          View Details
        </a>
        <a
          href={link}
          target={hasLink ? "_blank" : undefined}
          rel={hasLink ? "noreferrer" : undefined}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={`Apply now for ${match.title}`}
        >
          Apply Now
        </a>
      </div>
    </article>
  );
}
