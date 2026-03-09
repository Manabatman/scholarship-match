import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: March 2025</p>

        <div className="mt-8 space-y-6 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">What We Collect</h2>
            <p className="mt-2">
              We collect profile data you provide: name, email, age, education level, region, school, field of study,
              income bracket, and priority group status (e.g., underprivileged, 4Ps). This data is used solely to compute
              scholarship matches.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">How We Use It</h2>
            <p className="mt-2">
              Your data is used only to compute scholarship matches during your session. We do not sell your data, share
              it with scholarship providers, or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Data Retention</h2>
            <p className="mt-2">
              Profile data is stored to enable match retrieval. You can request deletion of your data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Analytics</h2>
            <p className="mt-2">
              We may use anonymous usage analytics (e.g., page views) for improving the service. We use Sentry for error
              tracking. No personal data is shared with analytics providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cookies</h2>
            <p className="mt-2">We use cookies only for session management. No tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Third-Party Services</h2>
            <p className="mt-2">
              We use Sentry for error tracking. When you click &quot;Apply Now&quot; on a scholarship, you are directed to
              external websites. We are not responsible for their privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Children&apos;s Privacy</h2>
            <p className="mt-2">
              This service is intended for students. We recommend parental guidance for users under 18.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contact</h2>
            <p className="mt-2">
              For data requests or questions, contact us through the contact information provided on this website.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link
            to="/settings"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to Settings
          </Link>
        </div>
      </div>
    </section>
  );
}
