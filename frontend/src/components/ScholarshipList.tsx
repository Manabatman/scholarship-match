import { useEffect, useState } from "react";
import type { ScholarshipInfo } from "../types";

const API_BASE_URL =
  (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8000";

interface ScholarshipListProps {
  onBuildProfile: () => void;
}

function ScholarshipBrowseCard({ s }: { s: ScholarshipInfo }) {
  const link = s.link && s.link.trim() ? s.link : "#";
  const hasLink = !!link && link.startsWith("http");
  const regions = (s.regions ?? []).map((r) => r.trim()).filter(Boolean);

  return (
    <article
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
      aria-labelledby={`scholarship-title-${s.id}`}
    >
      <div className="flex flex-1 flex-col">
        <div className="min-w-0 flex-1">
          <h3
            id={`scholarship-title-${s.id}`}
            className="text-lg font-semibold text-slate-900"
          >
            {s.title}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">{s.provider}</p>
        </div>

        {s.level && (
          <span className="mt-2 w-fit rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
            {s.level}
          </span>
        )}

        <p className="mt-3 line-clamp-3 text-sm text-slate-700">
          {s.description || "No description available."}
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

        {(s.min_age != null || s.max_age != null) && (
          <p className="mt-2 text-xs text-slate-500">
            Age: {s.min_age != null ? `Min ${s.min_age}` : ""}
            {s.min_age != null && s.max_age != null && " • "}
            {s.max_age != null ? `Max ${s.max_age}` : ""}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={link}
          target={hasLink ? "_blank" : undefined}
          rel={hasLink ? "noreferrer" : undefined}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={`View details for ${s.title}`}
        >
          View Details
        </a>
        <a
          href={link}
          target={hasLink ? "_blank" : undefined}
          rel={hasLink ? "noreferrer" : undefined}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={`Apply now for ${s.title}`}
        >
          Apply Now
        </a>
      </div>
    </article>
  );
}

export function ScholarshipList({ onBuildProfile }: ScholarshipListProps) {
  const [scholarships, setScholarships] = useState<ScholarshipInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/v1/scholarships`)
      .then((res) => {
        if (!res.ok) throw new Error("Unable to fetch scholarships");
        return res.json();
      })
      .then((data: ScholarshipInfo[]) => {
        if (!cancelled) setScholarships(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="scholarships" className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">
            All Scholarships
            <span className="ml-2 rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-800">
              {scholarships.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={onBuildProfile}
            className="w-fit rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="Build your profile to get personalized matches"
          >
            Build Profile for Matches
          </button>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-md">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
              aria-hidden
            />
            <p className="mt-4 text-slate-600">Loading scholarships...</p>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && scholarships.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-md">
            <p className="text-slate-600">No scholarships found.</p>
          </div>
        )}

        {!loading && !error && scholarships.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scholarships.map((s) => (
              <ScholarshipBrowseCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
