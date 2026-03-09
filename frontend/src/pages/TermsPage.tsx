import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: March 2025</p>

        <div className="mt-8 space-y-6 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By using this website, you agree to these Terms of Service. If you do not agree, please do not use the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">2. Description of Service</h2>
            <p className="mt-2">
              ISKONNECT is a scholarship matching tool. It helps you find scholarships you may qualify for based on your
              profile. This is not an application portal—you apply directly through each scholarship provider official
              website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">3. Permitted Use</h2>
            <p className="mt-2">
              You may use this service for personal, non-commercial use to find scholarships. You must provide accurate
              information when building your profile.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">4. Prohibited Activities</h2>
            <p className="mt-2">You may not:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Scrape, automate, or access the service programmatically without permission</li>
              <li>Impersonate or misrepresent your identity</li>
              <li>Submit false or misleading information</li>
              <li>Use the service for any purpose that violates applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">5. Data Accuracy Disclaimer</h2>
            <p className="mt-2">
              Scholarship information is collected from public sources and may not reflect the most current requirements.
              Always verify with the official provider. Matching does not guarantee eligibility or acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">6. Intellectual Property</h2>
            <p className="mt-2">
              The platform design, algorithms, and content are proprietary. You may not copy, modify, or distribute them
              without permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">7. Limitation of Liability</h2>
            <p className="mt-2">
              We are not liable for inaccurate scholarship data, missed deadlines, or any outcomes resulting from your
              use of this service. Use at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">8. Termination</h2>
            <p className="mt-2">
              We reserve the right to suspend or terminate access to this website for users who violate these terms or
              engage in malicious behavior.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">9. Governing Law</h2>
            <p className="mt-2">These terms are governed by the laws of the Philippines.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">10. Changes</h2>
            <p className="mt-2">
              We may update these terms. Continued use after changes constitutes acceptance. Check this page for updates.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link to="/settings" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            Back to Settings
          </Link>
        </div>
      </div>
    </section>
  );
}
