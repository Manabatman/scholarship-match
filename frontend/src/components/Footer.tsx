import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="bg-slate-900 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between">
          <div>
            <p className="font-semibold text-white">ISKONNECT</p>
            <p className="text-sm text-slate-400">Connecting Filipino Students to Opportunity</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/about" className="text-slate-400 hover:text-white">
              About
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="text-slate-400 hover:text-white">
              Privacy
            </Link>
            <Link to="/settings" className="text-slate-400 hover:text-white">
              Settings
            </Link>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {currentYear} ISKONNECT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
