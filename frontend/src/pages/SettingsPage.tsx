import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="py-12">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    theme === t
                      ? "bg-primary-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Legal</h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Updates</h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/changelog"
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Version</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">ISKONNECT v1.1</p>
          </section>
        </div>

        <div className="mt-12">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
