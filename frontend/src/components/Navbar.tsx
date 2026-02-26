interface NavbarProps {
  onBuildProfile: () => void;
  onScholarships: () => void;
  onAbout: () => void;
}

export function Navbar({ onBuildProfile, onScholarships, onAbout }: NavbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold text-primary-700">ISKOLAR</h1>
          <p className="text-xs text-slate-500">
            Connecting Filipino Students to Opportunity
          </p>
        </div>
        <nav className="hidden items-center gap-6 sm:flex">
          <button
            type="button"
            onClick={onBuildProfile}
            className="text-sm text-slate-600 transition hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-label="Build Profile"
          >
            Build Profile
          </button>
          <button
            type="button"
            onClick={onScholarships}
            className="text-sm text-slate-600 transition hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-label="Scholarships"
          >
            Scholarships
          </button>
          <button
            type="button"
            onClick={onAbout}
            className="text-sm text-slate-600 transition hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-label="About"
          >
            About
          </button>
        </nav>
      </div>
    </header>
  );
}
