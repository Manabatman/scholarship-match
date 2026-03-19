import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ScholarshipInfo } from "../types";
import { apiFetch } from "../api/client";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("iskonnect_token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function AdminPage() {
  const [scholarships, setScholarships] = useState<ScholarshipInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScholarships = () => {
    setLoading(true);
    apiFetch("/api/v1/scholarships?include_inactive=true", {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed to fetch");
        return res.json();
      })
      .then((data: ScholarshipInfo[]) => setScholarships(Array.isArray(data) ? data : []))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

  const handleDelete = (id: number) => {
    if (!confirm("Deactivate this scholarship?")) return;
    apiFetch(`/api/v1/scholarships/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete");
        fetchScholarships();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
            <p className="mt-2 text-sm">
              <Link to="/" className="text-primary-600 hover:underline">
                Return home
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Admin – Scholarships</h2>
          <Link
            to="/"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Back to app
          </Link>
        </div>

        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          {scholarships.length} scholarships. Use the API to add or edit (POST/PUT /api/v1/scholarships).
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">ID</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Title</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Provider</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Level</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Active</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scholarships.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{s.id}</td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{s.title}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{s.provider ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{s.level ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        s.is_active !== false ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {s.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      disabled={s.is_active === false}
                    >
                      Deactivate
                    </button>
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
