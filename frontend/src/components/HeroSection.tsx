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
              <div className="flex h-full items-center justify-center">
                <div className="grid grid-cols-3 gap-2 p-8">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-primary-200/60"
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
