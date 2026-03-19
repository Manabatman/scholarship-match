import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSavedScholarships } from "../contexts/SavedScholarshipsContext";
import type { MatchRunSummary, SavedScholarship, StudentProfileResponse } from "../types";
import { apiFetch } from "../api/client";

export function ProfileDashboard() {
  const { user, authHeaders, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<StudentProfileResponse[]>([]);
  const [runs, setRuns] = useState<MatchRunSummary[]>([]);
  const [saved, setSaved] = useState<SavedScholarship[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [selectedRuns, setSelectedRuns] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toggleSave } = useSavedScholarships();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const headers = authHeaders();
    setSavedLoading(true);
    Promise.all([
      apiFetch("/api/v1/profiles", { headers }).then((r) =>
        r.ok ? r.json() : []
      ),
      apiFetch("/api/v1/match-runs", { headers }).then((r) =>
        r.ok ? r.json() : []
      ),
      apiFetch("/api/v1/saved-scholarships", { headers }).then((r) =>
        r.ok ? r.json() : { saved: [] }
      ),
    ])
      .then(([profData, runsData, savedData]) => {
        setProfiles(Array.isArray(profData) ? profData : []);
        setRuns(Array.isArray(runsData) ? runsData : []);
        const savedList = (savedData as { saved?: SavedScholarship[] }).saved;
        setSaved(Array.isArray(savedList) ? savedList : []);
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => {
        setLoading(false);
        setSavedLoading(false);
      });
  }, [user, authHeaders]);

  const handleRunMatches = async () => {
    const profile = profiles[0];
    if (!profile) {
      setError("Create a profile first");
      return;
    }
    setError(null);
    setRunLoading(true);
    try {
      const res = await apiFetch("/api/v1/match-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ profile_id: profile.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Failed to run matches");
      }
      const data = await res.json();
      setRuns((prev) => [
        {
          id: data.run_id,
          profile_id: data.profile_id,
          created_at: data.created_at,
          result_count: data.matches?.length ?? 0,
        },
        ...prev,
      ]);
      navigate(`/match/${profile.id}?run=${data.run_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run matches");
    } finally {
      setRunLoading(false);
    }
  };

  const toggleRunSelection = (id: number) => {
    setSelectedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCompare = () => {
    const arr = Array.from(selectedRuns);
    if (arr.length !== 2) {
      setError("Select exactly 2 runs to compare");
      return;
    }
    navigate(`/match-compare?run_a=${arr[0]}&run_b=${arr[1]}`);
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  if (authLoading || !user) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12">
            <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Your Dashboard
        </h2>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Profile section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Your Profile
          </h3>
          {loading ? (
            <div className="mt-4 h-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
          ) : profiles.length === 0 ? (
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              No profile yet.{" "}
              <Link
                to="/"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Create your profile
              </Link>
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {profiles[0].full_name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {profiles[0].email} • {profiles[0].region ?? "—"} •{" "}
                  {profiles[0].education_level ?? "—"}
                </p>
              </div>
              <Link
                to="/"
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                Edit Profile
              </Link>
            </div>
          )}
        </div>

        {/* Match runs section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Past Match Runs
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRunMatches}
                disabled={loading || runLoading || profiles.length === 0}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {runLoading ? "Running..." : "Run New Matches"}
              </button>
              <button
                type="button"
                onClick={handleCompare}
                disabled={selectedRuns.size !== 2}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Compare Selected
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 h-32 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
          ) : runs.length === 0 ? (
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              No match runs yet. Create a profile and run matches to see your
              history.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedRuns.has(run.id)}
                    onChange={() => toggleRunSelection(run.id)}
                    className="rounded border-slate-300 text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(run.created_at)}
                    </span>
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                      {run.result_count} matches
                    </span>
                  </div>
                  <Link
                    to={`/match/${run.profile_id}?run=${run.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Results
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Scholarships section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Saved Scholarships
          </h3>
          {savedLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
          ) : saved.length === 0 ? (
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              No saved scholarships yet.{" "}
              <Link
                to="/scholarships/search"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Browse scholarships
              </Link>{" "}
              to save some.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {saved.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/scholarship/${item.scholarship_id}`}
                      className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {item.scholarship?.title ?? `Scholarship #${item.scholarship_id}`}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.scholarship?.provider ?? "—"}
                      {item.scholarship?.application_deadline && (
                        <> • Deadline: {new Date(item.scholarship.application_deadline).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleSave(item.scholarship_id);
                      setSaved((prev) => prev.filter((x) => x.scholarship_id !== item.scholarship_id));
                    }}
                    className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    title="Remove from saved"
                    aria-label="Remove from saved"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
