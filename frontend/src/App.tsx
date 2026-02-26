import { FormEvent, useState } from "react";

const API_BASE_URL =
  (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Step = "profile" | "results";

interface StudentProfile {
  full_name: string;
  email: string;
  age: number;
  region: string;
  school: string;
  needs: string[];
}

interface MatchResult {
  id: number;
  title: string;
  provider: string;
  score: number;
  link: string;
  description: string;
  regions: string[];
  min_age: number | null;
  max_age: number | null;
}

function App() {
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  const handleSubmitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const profile: StudentProfile = {
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? ""),
      age: Number(formData.get("age") ?? 0),
      region: String(formData.get("region") ?? ""),
      school: String(formData.get("school") ?? ""),
      needs: String(formData.get("needs") ?? "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
    };

    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/v1/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(profile)
      });

      if (!profileRes.ok) {
        const data = await profileRes.json().catch(() => null);
        throw new Error(data?.detail ?? "Unable to create profile");
      }

      const created = await profileRes.json();

      const matchesRes = await fetch(
        `${API_BASE_URL}/api/v1/matches/${created.id}`
      );
      if (!matchesRes.ok) {
        throw new Error("Unable to fetch matches");
      }
      const matchData = await matchesRes.json();
      setMatches(matchData.matches ?? []);
      setStep("results");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white shadow-lg shadow-brand-500/40">
              SM
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Scholarship Match
              </div>
              <p className="text-xs text-slate-600">
                Match students to funding in seconds.
              </p>
            </div>
          </div>

          <div className="hidden text-xs sm:flex sm:items-center sm:gap-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Demo ready
            </span>
            <span className="text-slate-500">
              Backend: FastAPI &middot; Frontend: React + Vite
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:py-12">
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="bg-gradient-to-r from-brand-700 via-brand-500 to-accent-500 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                Find scholarships tailored to your students in a single step.
              </h1>
              <p className="mt-3 text-sm text-slate-700 sm:text-base">
                Capture a student&apos;s profile, and we&apos;ll instantly
                surface the most relevant scholarships based on their background
                and needs.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-brand-50 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Age &amp; region aware matching
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-accent-50 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                Student needs captured as tags
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Simple workflow for counselors &amp; students
              </span>
            </div>

            {step === "profile" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-brand-700">
                    Student profile
                  </h2>
                  <span className="text-xs text-slate-500">
                    Step 1 of 2 &middot; Profile → Matches
                  </span>
                </div>

                <form
                  className="grid gap-3 sm:grid-cols-2 sm:gap-4"
                  onSubmit={handleSubmitProfile}
                >
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-700">
                      Full name
                    </label>
                    <input
                      name="full_name"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-500/0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                      placeholder="e.g. Jordan Taylor"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-500/0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                      placeholder="jordan@example.edu"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Age
                    </label>
                    <input
                      name="age"
                      type="number"
                      min={13}
                      max={120}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-500/0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                      placeholder="17"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">
                      Region
                    </label>
                    <input
                      name="region"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-500/0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                      placeholder="e.g. Midwest, Lagos, etc."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-700">
                      School
                    </label>
                    <input
                      name="school"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-500/0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                      placeholder="Current or target school"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-700">
                      Needs / tags
                    </label>
                    <textarea
                      name="needs"
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-500/0 transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                      placeholder="Comma-separated needs, e.g. first-gen, housing, books, STEM, family support"
                    />
                    <p className="mt-1 text-[0.7rem] text-slate-500">
                      We&apos;ll use these tags when scoring scholarships against
                      the student&apos;s profile.
                    </p>
                  </div>

                  {error && (
                    <div className="sm:col-span-2">
                      <div className="rounded-lg border border-red-500/40 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {error}
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1">
                    <p className="text-[0.7rem] text-slate-500">
                      We only store minimal data needed for matching in this
                      demo.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-600/40 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-100 border-t-transparent" />
                          Matching...
                        </>
                      ) : (
                        <>
                          Get matches
                          <span className="text-accent-500">↗</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === "results" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-brand-700">
                    Matched scholarships
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("profile");
                      setMatches([]);
                      setError(null);
                    }}
                    className="text-[0.7rem] text-brand-600 hover:text-brand-500"
                  >
                    Start a new profile
                  </button>
                </div>

                {matches.length === 0 ? (
                  <p className="text-sm text-slate-700">
                    No matches found yet for this profile. Try adjusting age,
                    region, or needs and run again.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((m) => (
                      <article
                        key={m.id}
                        className="group rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-brand-500/60 hover:bg-brand-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              {m.title}
                            </h3>
                            <p className="text-xs text-slate-600">
                              {m.provider}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[0.65rem] font-semibold text-brand-700">
                              Match score{" "}
                              <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[0.65rem] text-white">
                                {Math.round(m.score)}
                              </span>
                            </span>
                            {(m.min_age || m.max_age) && (
                              <span className="text-[0.65rem] text-slate-600">
                                {m.min_age && `Min ${m.min_age}`}{" "}
                                {m.max_age && `• Max ${m.max_age}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 line-clamp-2 text-xs text-slate-700">
                          {m.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {m.regions.slice(0, 3).map((r) => (
                              <span
                                key={r}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] text-slate-800"
                              >
                                {r}
                              </span>
                            ))}
                            {m.regions.length > 3 && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] text-slate-600">
                                +{m.regions.length - 3} more
                              </span>
                            )}
                          </div>

                          <a
                            href={m.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-brand-700 hover:text-brand-600"
                          >
                            View scholarship
                            <span aria-hidden>↗</span>
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3">
            <div className="rounded-2xl border border-slate-200 bg-brand-900 p-4 shadow-[0_0_40px_rgba(123,17,19,0.35)]">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-400">
                Matching engine
              </h2>
              <p className="mt-2 text-xs text-slate-100">
                Behind the scenes, we score each scholarship against the
                student&apos;s age, region, and needs. This prototype uses a
                rule-based engine via FastAPI and SQLAlchemy, so you can ship
                quickly and iterate on the logic later.
              </p>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-100">
                <div>
                  <dt className="text-[0.65rem] text-accent-400">
                    Age alignment
                  </dt>
                  <dd className="mt-1 rounded-lg border border-brand-700 bg-brand-800 px-3 py-2">
                    Scores are boosted when the student falls fully inside the
                    scholarship&apos;s age band.
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] text-accent-400">
                    Region &amp; needs
                  </dt>
                  <dd className="mt-1 rounded-lg border border-brand-700 bg-brand-800 px-3 py-2">
                    Regions and needs tags improve ranking when they overlap
                    with scholarship targeting.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-4 text-xs text-slate-800">
              <h3 className="text-xs font-semibold text-brand-700">
                How to run the demo
              </h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>
                  Start the backend with{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[0.7rem] text-slate-900 shadow-sm">
                    uvicorn app.main:app --reload
                  </code>{" "}
                  (or your existing script).
                </li>
                <li>
                  From the{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[0.7rem] text-slate-900 shadow-sm">
                    frontend
                  </code>{" "}
                  folder, run{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[0.7rem] text-slate-900 shadow-sm">
                    npm install
                  </code>{" "}
                  then{" "}
                  <code className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.7rem] text-slate-100">
                    npm run dev
                  </code>
                  .
                </li>
                <li>
                  Visit{" "}
                  <span className="font-mono text-[0.7rem] text-brand-700">
                    http://localhost:5173
                  </span>{" "}
                  and walk through the flow with a student.
                </li>
              </ol>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
