import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { BookmarkButton } from "../components/BookmarkButton";
import { useDebounce } from "../hooks/useDebounce";
import { ScholarshipSearchFilters } from "../components/ScholarshipSearchFilters";
import { ScholarshipDetailPanel } from "../components/ScholarshipDetailPanel";
import type {
  ScholarshipInfo,
  ScholarshipSearchResponse,
  ScholarshipSearchFilters as ScholarshipSearchFiltersType,
} from "../types";

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

function SearchCard({
  s,
  onSelect,
}: {
  s: ScholarshipInfo;
  onSelect: (s: ScholarshipInfo) => void;
}) {
  const link = s.link && s.link.trim() ? s.link : "#";
  const hasLink = !!link && link.startsWith("http");
  const regions = (s.regions ?? []).map((r) => r.trim()).filter(Boolean);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(s)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(s);
        }
      }}
      className="flex cursor-pointer flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-primary-300 dark:hover:ring-primary-700"
      aria-labelledby={`search-card-title-${s.id}`}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              id={`search-card-title-${s.id}`}
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {s.title}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{s.provider}</p>
          </div>
          <BookmarkButton scholarshipId={s.id} />
        </div>

        {s.level && (
          <span className="mt-2 w-fit rounded-full bg-primary-100 dark:bg-primary-900 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-300">
            {s.level}
          </span>
        )}

        <p className="mt-3 line-clamp-3 text-sm text-slate-700 dark:text-slate-300">
          {s.description || "No description available."}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {regions.slice(0, 4).map((r) => (
            <span
              key={r}
              className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300"
            >
              {r}
            </span>
          ))}
          {regions.length > 4 && (
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
              +{regions.length - 4} more
            </span>
          )}
        </div>

        {(s.min_age != null || s.max_age != null) && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Age: {s.min_age != null ? `Min ${s.min_age}` : ""}
            {s.min_age != null && s.max_age != null && " • "}
            {s.max_age != null ? `Max ${s.max_age}` : ""}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(s);
          }}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          View Details
        </button>
        {hasLink ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Apply Now
          </a>
        ) : (
          <span className="rounded-lg bg-slate-200 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed">
            Link unavailable
          </span>
        )}
      </div>
    </article>
  );
}

export function ScholarshipSearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ScholarshipSearchFiltersType>({});
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<ScholarshipInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<ScholarshipInfo | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const justSelectedRef = useRef(false);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const fetchSearch = useCallback(
    async (searchQuery: string, searchFilters: ScholarshipSearchFiltersType, pageNum: number) => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("query", searchQuery.trim());
      if (searchFilters.region) params.set("region", searchFilters.region);
      if (searchFilters.field) params.set("field", searchFilters.field);
      if (searchFilters.education_level) params.set("education_level", searchFilters.education_level);
      if (searchFilters.provider) params.set("provider", searchFilters.provider);
      if (searchFilters.max_income != null && searchFilters.max_income >= 0) {
        params.set("max_income", String(searchFilters.max_income));
      }
      params.set("page", String(pageNum));
      params.set("limit", String(PAGE_SIZE));

      const res = await apiFetch(`/api/v1/scholarships/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = (await res.json()) as ScholarshipSearchResponse;
      return data;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSearch(query, filters, page)
      .then((data) => {
        if (!cancelled) {
          setResults(data.results ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.total_pages ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, filters, page, fetchSearch]);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    const params = new URLSearchParams({ q: debouncedQuery.trim() });
    apiFetch(`/api/v1/suggestions/scholarships?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { suggestions: [] }))
      .then((data: { suggestions?: string[] }) => {
        setSuggestions(data.suggestions ?? []);
        setHighlightIndex(-1);
        setSuggestionsOpen(true);
      })
      .catch(() => setSuggestions([]));
  }, [debouncedQuery]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    justSelectedRef.current = true;
    setQuery(suggestion);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setPage(1);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionsOpen(false);
    setPage(1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!suggestionsOpen || suggestions.length === 0) {
        if (e.key === "Escape") setSuggestionsOpen(false);
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[highlightIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSuggestionsOpen(false);
          setHighlightIndex(-1);
          break;
      }
    },
    [suggestionsOpen, suggestions, highlightIndex, handleSuggestionSelect]
  );

  useEffect(() => {
    if (highlightIndex >= 0 && suggestionsRef.current) {
      const el = suggestionsRef.current.children[highlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleFiltersChange = useCallback((newFilters: ScholarshipSearchFiltersType) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  return (
    <section id="scholarship-search" className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Search Scholarships
          </h1>
          <Link
            to="/"
            className="w-fit rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Build Profile for Matches
          </Link>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative mb-6">
          <label htmlFor="search-input" className="sr-only">
            Search scholarship names
          </label>
          <input
            ref={searchInputRef}
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && suggestions.length > 0 && setSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. DOST, CHED, Merit"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen}
          />
          {suggestionsOpen && suggestions.length > 0 && (
            <ul
              ref={suggestionsRef}
              role="listbox"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-1 shadow-lg"
            >
              {suggestions.map((item, i) => (
                <li
                  key={item}
                  role="option"
                  aria-selected={i === highlightIndex}
                  className={`cursor-pointer px-4 py-2 text-sm text-slate-900 dark:text-slate-100 ${
                    i === highlightIndex
                      ? "bg-primary-100 dark:bg-primary-900"
                      : "hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionSelect(item);
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-64 lg:shrink-0">
            <ScholarshipSearchFilters filters={filters} onChange={handleFiltersChange} />
          </div>

          <div className="min-w-0 flex-1">
            {loading && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center shadow-md">
                <div
                  className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
                  aria-hidden
                />
                <p className="mt-4 text-slate-600 dark:text-slate-400">Searching...</p>
              </div>
            )}

            {error && (
              <div
                className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-300"
                role="alert"
              >
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                  {total} scholarship{total !== 1 ? "s" : ""} found
                </p>

                {results.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center shadow-md">
                    <p className="text-slate-600 dark:text-slate-400">No scholarships match your search.</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
                      Try adjusting your filters or search query.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {results.map((s) => (
                        <SearchCard key={s.id} s={s} onSelect={setSelectedScholarship} />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <nav
                        className="mt-8 flex flex-wrap items-center justify-center gap-2"
                        aria-label="Pagination"
                      >
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600"
                        >
                          Next
                        </button>
                      </nav>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedScholarship && (
        <ScholarshipDetailPanel
          scholarship={selectedScholarship as Parameters<typeof ScholarshipDetailPanel>[0]["scholarship"]}
          onClose={() => setSelectedScholarship(null)}
          isOpen={!!selectedScholarship}
        />
      )}
    </section>
  );
}
