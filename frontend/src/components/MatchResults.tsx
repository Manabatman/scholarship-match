import type { MatchResult } from "../types";
import { ScholarshipCard } from "./ScholarshipCard";

interface MatchResultsProps {
  matches: MatchResult[];
  onReset: () => void;
}

export function MatchResults({ matches, onReset }: MatchResultsProps) {
  return (
    <section id="scholarships" className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">
            Your Top Matches
            <span className="ml-2 rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-800">
              {matches.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={onReset}
            className="w-fit text-sm font-medium text-primary-600 transition hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-label="Start a new profile"
          >
            Start new profile
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-700">
              No matches found yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your age, region, or needs and run the matching again.
            </p>
            <button
              type="button"
              onClick={onReset}
              className="mt-6 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Start a new profile"
            >
              Start new profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <ScholarshipCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
