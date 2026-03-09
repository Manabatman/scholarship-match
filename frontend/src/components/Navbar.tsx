import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-primary-700">ISKOLAR</h1>
          <p className="text-xs text-slate-500">
            Connecting Filipino Students to Opportunity
          </p>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            to="/"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/"
                ? "font-medium text-primary-600"
                : "text-slate-600 hover:text-primary-600"
            }`}
            aria-label="Build Profile"
          >
            Build Profile
          </Link>
          <Link
            to="/scholarships"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/scholarships"
                ? "font-medium text-primary-600"
                : "text-slate-600 hover:text-primary-600"
            }`}
            aria-label="Scholarships"
          >
            Scholarships
          </Link>
          <button
            type="button"
            onClick={scrollToAbout}
            className="text-sm text-slate-600 transition hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-label="About"
          >
            About
          </button>
          <Link
            to="/admin"
            className={`text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
              location.pathname === "/admin"
                ? "font-medium text-primary-600"
                : "text-slate-600 hover:text-primary-600"
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
