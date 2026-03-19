import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import { useDebounce } from "../hooks/useDebounce";
import { PHILIPPINE_REGIONS } from "../constants/regions";
import type { ScholarshipSearchFilters } from "../types";

const EDUCATION_LEVELS = [
  "Senior High School",
  "College",
  "Graduate",
  "TVET",
] as const;

const INCOME_OPTIONS: { label: string; value: number }[] = [
  { label: "Any", value: -1 },
  { label: "Below ₱250K", value: 250_000 },
  { label: "₱250K - ₱400K", value: 400_000 },
  { label: "₱400K - ₱500K", value: 500_000 },
  { label: "Above ₱500K", value: 999_999_999 },
];

interface ScholarshipFilterOptions {
  providers: string[];
  education_levels: string[];
  regions: string[];
  fields_of_study: string[];
}

interface ScholarshipSearchFiltersProps {
  filters: ScholarshipSearchFilters;
  onChange: (filters: ScholarshipSearchFilters) => void;
}

export function ScholarshipSearchFilters({ filters, onChange }: ScholarshipSearchFiltersProps) {
  const [filterOptions, setFilterOptions] = useState<ScholarshipFilterOptions>({
    providers: [],
    education_levels: [],
    regions: [],
    fields_of_study: [],
  });
  const [providerInput, setProviderInput] = useState(filters.provider ?? "");

  useEffect(() => {
    setProviderInput(filters.provider ?? "");
  }, [filters.provider]);
  const [providerSuggestions, setProviderSuggestions] = useState<string[]>([]);
  const [providerOpen, setProviderOpen] = useState(false);
  const providerInputRef = useRef<HTMLInputElement>(null);
  const debouncedProvider = useDebounce(providerInput, 200);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/v1/scholarships/search/filters")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setFilterOptions({
            providers: data.providers ?? [],
            education_levels: data.education_levels ?? [],
            regions: data.regions ?? [],
            fields_of_study: data.fields_of_study ?? [],
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!debouncedProvider.trim()) {
      setProviderSuggestions([]);
      return;
    }
    const q = debouncedProvider.toLowerCase();
    const matches = filterOptions.providers.filter((p) =>
      p.toLowerCase().includes(q)
    );
    setProviderSuggestions(matches.slice(0, 10));
    setProviderOpen(true);
  }, [debouncedProvider, filterOptions.providers]);

  const updateFilter = useCallback(
    <K extends keyof ScholarshipSearchFilters>(key: K, value: ScholarshipSearchFilters[K]) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const handleClearAll = useCallback(() => {
    setProviderInput("");
    onChange({});
  }, [onChange]);

  const hasActiveFilters =
    filters.region ||
    filters.field ||
    filters.education_level ||
    filters.provider ||
    (filters.max_income != null && filters.max_income >= 0);

  const selectClassName =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 focus:border-primary-500";
  const inputClassName =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 focus:border-primary-500";

  return (
    <aside className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="filter-region" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Region
          </label>
          <select
            id="filter-region"
            value={filters.region ?? ""}
            onChange={(e) => updateFilter("region", e.target.value || undefined)}
            className={selectClassName}
          >
            <option value="">All regions</option>
            {PHILIPPINE_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-education" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Education Level
          </label>
          <select
            id="filter-education"
            value={filters.education_level ?? ""}
            onChange={(e) => updateFilter("education_level", e.target.value || undefined)}
            className={selectClassName}
          >
            <option value="">All levels</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-field" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Field of Study
          </label>
          <input
            id="filter-field"
            type="text"
            value={filters.field ?? ""}
            onChange={(e) => updateFilter("field", e.target.value || undefined)}
            placeholder="e.g. Engineering, STEM"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="filter-income" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Max Household Income
          </label>
          <select
            id="filter-income"
            value={
              filters.max_income != null && filters.max_income >= 0
                ? filters.max_income
                : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              updateFilter("max_income", v === "" ? undefined : Number(v));
            }}
            className={selectClassName}
          >
            {INCOME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value === -1 ? "" : opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label htmlFor="filter-provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Scholarship Provider
          </label>
          <input
            ref={providerInputRef}
            id="filter-provider"
            type="text"
            value={providerInput}
            onChange={(e) => setProviderInput(e.target.value)}
            onFocus={() => providerInput && setProviderOpen(true)}
            onBlur={(e) => {
              const val = (e.target as HTMLInputElement).value.trim() || undefined;
              setTimeout(() => {
                setProviderOpen(false);
                updateFilter("provider", val);
              }, 150);
            }}
            placeholder="e.g. DOST, CHED"
            className={inputClassName}
          />
          {providerOpen && providerSuggestions.length > 0 && (
            <ul
              className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-1 shadow-lg"
              role="listbox"
            >
              {providerSuggestions.map((p) => (
                <li
                  key={p}
                  role="option"
                  className="cursor-pointer px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setProviderInput(p);
                    updateFilter("provider", p);
                    setProviderOpen(false);
                  }}
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
