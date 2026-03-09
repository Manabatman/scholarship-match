import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">About ISKONNECT</h1>

        <div className="mt-8 space-y-8 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Our Mission</h2>
            <p className="mt-2">
              ISKONNECT helps Filipino students discover scholarships they qualify for. We match your profile against
              eligibility criteria from government, private, and institutional scholarship programs across the
              Philippines.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">How Matching Works</h2>
            <p className="mt-2">
              We check your education level, region, field of study, financial situation, and priority group status
              against each scholarship&apos;s requirements. Scholarships that pass all eligibility criteria are scored
              and ranked by how well you fit. You can see why each scholarship matched in the &quot;Why you matched&quot;
              section.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Transparency</h2>
            <p className="mt-2">
              Our recommendations are based on publicly available eligibility criteria. ISKONNECT is not affiliated with
              any scholarship provider. Always verify eligibility on the official scholarship website before applying.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Data</h2>
            <p className="mt-2">
              We do not share your profile with any third party. Your data is used only to compute your matches. For
              more details, see our{" "}
              <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Build your profile
          </Link>
        </div>
      </div>
    </section>
  );
}
