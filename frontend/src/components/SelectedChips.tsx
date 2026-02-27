interface SelectedChipsProps {
  selected: string[];
  onRemove: (tag: string) => void;
  emptyMessage?: string;
}

export function SelectedChips({
  selected,
  onRemove,
  emptyMessage = "No selections yet",
}: SelectedChipsProps) {
  if (selected.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">{emptyMessage}</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selected.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(tag)}
            className="rounded-full p-0.5 transition hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            aria-label={`Remove ${tag}`}
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
