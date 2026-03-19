import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSavedScholarships } from "../contexts/SavedScholarshipsContext";

interface BookmarkButtonProps {
  scholarshipId: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function BookmarkButton({ scholarshipId, className = "", onClick }: BookmarkButtonProps) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedScholarships();
  const [toggling, setToggling] = useState(false);

  const saved = isSaved(scholarshipId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
    if (!user || toggling) return;
    setToggling(true);
    try {
      await toggleSave(scholarshipId);
    } finally {
      setToggling(false);
    }
  };

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Log in to save"
        className={`rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-500 ${className}`}
        aria-label="Save scholarship (log in required)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggling}
      title={saved ? "Remove from saved" : "Save scholarship"}
      className={`rounded p-1.5 transition ${
        saved
          ? "text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30"
          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
      } disabled:opacity-50 ${className}`}
      aria-label={saved ? "Remove from saved" : "Save scholarship"}
      aria-pressed={saved}
    >
      {saved ? (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}
