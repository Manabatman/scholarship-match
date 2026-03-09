import { Link } from "react-router-dom";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "feature" | "fix" | "improvement";
  title: string;
  description: string;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2025-03",
    type: "feature",
    title: "Initial release",
    description: "Scholarship matching platform with profile builder, eligibility matching, and ranked results.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "feature",
    title: "Scholarship detail page",
    description: "View Details now opens an internal page with full eligibility, benefits, requirements, and timeline.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "feature",
    title: "Multiple course preferences",
    description: "Users can now specify up to 3 preferred courses for better matching.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "improvement",
    title: "Tiered form validation",
    description: "Required and recommended fields with clear validation and confirmation dialog.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "feature",
    title: "Legal pages",
    description: "Added About, Terms of Service, Privacy Policy, Settings, and Changelog pages.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "fix",
    title: "Duplicate questions removed",
    description: "Underprivileged and OFW Dependent no longer asked twice.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "improvement",
    title: "Region dropdown",
    description: "Region selection replaced with dropdown of 17 Philippine regions.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "improvement",
    title: "Why You Matched redesign",
    description: "Match breakdown now shows as a card-based scorecard with clearer labels.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "improvement",
    title: "Nationwide scholarships",
    description: "Nationwide scholarships now display correctly with empty region list.",
  },
  {
    version: "1.1.0",
    date: "2025-03",
    type: "improvement",
    title: "Application timing",
    description: "Shows 'Opens in X days' when application is not yet open.",
  },
];

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case "feature":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "fix":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "improvement":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
  }
}

export function ChangelogPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Changelog</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">History of updates and improvements.</p>

        <div className="mt-8 space-y-6">
          {CHANGELOG.map((entry, i) => (
            <article
              key={i}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.version}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{entry.date}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeClass(entry.type)}`}
                >
                  {entry.type}
                </span>
              </div>
              <h3 className="mt-2 font-medium text-slate-800 dark:text-slate-200">{entry.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{entry.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <Link
            to="/settings"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to Settings
          </Link>
        </div>
      </div>
    </section>
  );
}
