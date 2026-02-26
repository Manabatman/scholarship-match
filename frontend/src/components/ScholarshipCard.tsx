import type { MatchResult } from "../types";

function getScoreBadgeClasses(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-primary-100 text-primary-800";
  if (score >= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-slate-100 text-slate-600";
}

interface ScholarshipCardProps {
  match: MatchResult;
}

export function ScholarshipCard({ match }: ScholarshipCardProps) {
  const scoreBadgeClasses = getScoreBadgeClasses(match.score);
  const link = match.link && match.link.trim() ? match.link : "#";
  const hasLink = !!link && link.startsWith("http");
  const regions = (match.regions ?? []).map((r) => r.trim()).filter(Boolean);

  return (
    <article
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
      aria-labelledby={`scholarship-title-${match.id}`}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              id={`scholarship-title-${match.id}`}
              className="text-lg font-semibold text-slate-900"
            >
              {match.title}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">{match.provider}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${scoreBadgeClasses}`}
          >
            {Math.round(match.score)}% match
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-slate-700">
          {match.description || "No description available."}
        </p>

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
