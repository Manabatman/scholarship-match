import { useState } from "react";

interface NeedsCategoryAccordionProps {
  categories: readonly {
    readonly label: string;
    readonly tags: readonly string[];
  }[];
  selected: string[];
  onToggle: (tag: string) => void;
}

export function NeedsCategoryAccordion({
  categories,
  selected,
  onToggle,
}: NeedsCategoryAccordionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    categories.forEach((c) => {
      init[c.label] = false;
    });
    return init;
  });

  const toggleSection = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="space-y-1">
      {categories.map(({ label, tags }) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
        >
          <button
            type="button"
            onClick={() => toggleSection(label)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
            aria-expanded={expanded[label] ?? false}
            aria-controls={`needs-section-${label.replace(/\s/g, "-")}`}
          >
            {label}
            <svg
              className={`h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400 transition-transform ${
                expanded[label] ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            id={`needs-section-${label.replace(/\s/g, "-")}`}
            className={`overflow-hidden transition-all ${
              expanded[label] ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-700 p-4">
              {tags.map((tag) => {
                const isSelected = selected.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggle(tag)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
