import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-primary-700 dark:text-primary-400">ISKONNECT</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connecting Filipino Students to Opportunity
          </p>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            to="/"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/"
                ? "font-medium text-primary-600 dark:text-primary-400"
                : "text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            }`}
            aria-label="Build Profile"
          >
            Build Profile
          </Link>
          <Link
            to="/scholarships"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/scholarships"
                ? "font-medium text-primary-600 dark:text-primary-400"
                : "text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            }`}
            aria-label="Scholarships"
          >
            Scholarships
          </Link>
          <Link
            to="/about"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/about"
                ? "font-medium text-primary-600 dark:text-primary-400"
                : "text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            }`}
            aria-label="About"
          >
            About
          </Link>
          <Link
            to="/settings"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/settings"
                ? "font-medium text-primary-600 dark:text-primary-400"
                : "text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            }`}
            aria-label="Settings"
          >
            Settings
          </Link>
          <Link
            to="/admin"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/admin"
                ? "font-medium text-primary-600 dark:text-primary-400"
                : "text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            }`}
            aria-label="Admin"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
