interface HeroSectionProps {
  onCtaClick: () => void;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-slate-900">
              Find the Right Scholarship for You.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Answer a few questions and discover scholarships you qualify for.
            </p>
            <button
              type="button"
              onClick={onCtaClick}
              className="mt-6 w-fit rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Build My Profile"
            >
              Build My Profile
            </button>
          </div>
          <div className="flex items-center justify-center">
            <div className="h-64 w-full max-w-sm rounded-2xl border border-slate-200 bg-primary-50 shadow-lg sm:h-80">
              <div className="flex h-full items-center justify-center p-8">
                <svg
                  viewBox="0 0 160 140"
                  className="h-full w-full text-primary-600"
                  aria-hidden
                >
                  <path
                    d="M80 15 L25 42 L80 70 L135 42 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <path
                    d="M70 70 L80 75 L90 70 L80 65 Z"
                    fill="currentColor"
                  />
                  <line
                    x1="80"
                    y1="75"
                    x2="80"
                    y2="115"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <circle cx="80" cy="120" r="10" fill="currentColor" opacity="0.7" />
                  <ellipse
                    cx="80"
                    cy="95"
                    rx="55"
                    ry="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
