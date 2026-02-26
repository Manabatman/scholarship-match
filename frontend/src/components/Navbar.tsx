export function Navbar() {
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
          <a
            href="#profile"
            className="text-sm text-slate-600 transition hover:text-primary-600"
            aria-label="Build Profile"
          >
            Build Profile
          </a>
          <a
            href="#scholarships"
            className="text-sm text-slate-600 transition hover:text-primary-600"
            aria-label="Scholarships"
          >
            Scholarships
          </a>
          <a
            href="#about"
            className="text-sm text-slate-600 transition hover:text-primary-600"
            aria-label="About"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
