export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="bg-slate-900 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-2 text-center text-slate-400 sm:flex-row sm:justify-between">
          <div>
            <p className="font-semibold text-white">ISKOLAR</p>
            <p className="text-sm">Connecting Filipino Students to Opportunity</p>
          </div>
          <p className="text-sm">
            &copy; {currentYear} ISKOLAR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
