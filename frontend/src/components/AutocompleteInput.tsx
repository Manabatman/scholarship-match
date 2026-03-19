import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import { useDebounce } from "../hooks/useDebounce";

interface AutocompleteInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  endpoint: string;
  extraParams?: Record<string, string>;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

const DEBOUNCE_MS = 300;

export function AutocompleteInput({
  id,
  name,
  value,
  onChange,
  endpoint,
  extraParams = {},
  placeholder,
  required = false,
  className = "",
  label,
  error,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const extraParamsRef = useRef(extraParams);
  extraParamsRef.current = extraParams;
  const justSelectedRef = useRef(false);

  const debouncedQuery = useDebounce(value, DEBOUNCE_MS);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        Object.entries(extraParamsRef.current).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
        const res = await apiFetch(`${endpoint}?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as { suggestions?: string[] };
          setSuggestions(data.suggestions ?? []);
          setHighlightIndex(-1);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [debouncedQuery, fetchSuggestions]);

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleSelect = (item: string) => {
    justSelectedRef.current = true;
    onChange(name, item);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Escape") setIsOpen(false);
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
          handleSelect(suggestions[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const inputClassName = `mt-1 w-full rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none transition focus:ring-2 focus:ring-primary-200 ${error ? "border-red-500" : "border-slate-300 dark:border-slate-600 focus:border-primary-500"} ${className}`;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onFocus={() => value.trim() && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={inputClassName}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={highlightIndex >= 0 ? `${id}-opt-${highlightIndex}` : undefined}
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
            aria-hidden
          />
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-1 shadow-lg"
        >
          {suggestions.map((item, i) => (
            <li
              key={item}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              className={`cursor-pointer px-3 py-2 text-sm text-slate-900 dark:text-slate-100 ${
                i === highlightIndex ? "bg-primary-100 dark:bg-primary-900" : "hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
