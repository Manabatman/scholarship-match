import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { MatchComparisonResponse } from "../types";
import { apiFetch } from "../api/client";

export function MatchComparisonPage() {
  const [searchParams] = useSearchParams();
  const runA = searchParams.get("run_a");
  const runB = searchParams.get("run_b");
  const { user, authHeaders, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);
  const [data, setData] = useState<MatchComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!runA || !runB) {
      setLoading(false);
      setError("Missing run_a or run_b");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(
      `/api/v1/match-runs/compare?run_a=${runA}&run_b=${runB}`,
      { headers: authHeaders() }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Unable to fetch comparison");
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [runA, runB, user, authHeaders]);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  const formatScore = (v: number | null | undefined) =>
    v != null ? v.toFixed(1) : "—";

  if (authLoading || !user || loading) {
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

  if (error) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Compare Match Runs
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Run A
            </h3>
            <p className="mt-1 text-slate-900 dark:text-slate-100">
              {formatDate(data.run_a.created_at)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {data.run_a.result_count} matches
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Run B
            </h3>
            <p className="mt-1 text-slate-900 dark:text-slate-100">
              {formatDate(data.run_b.created_at)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {data.run_b.result_count} matches
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                  Scholarship
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                  Score A
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  Change
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                  Score B
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.items.map((item) => (
                <tr key={item.scholarship_id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      {item.provider && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {item.provider}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                    {formatScore(item.score_a)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.score_diff != null ? (
                      item.score_diff > 0 ? (
                        <span className="text-green-600 dark:text-green-400">
                          ↑ +{item.score_diff.toFixed(1)}
                        </span>
                      ) : item.score_diff < 0 ? (
                        <span className="text-red-600 dark:text-red-400">
                          ↓ {item.score_diff.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                    {formatScore(item.score_b)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
