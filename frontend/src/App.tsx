import { FormEvent, useCallback, useState } from "react";
import type { MatchResult, StudentProfile } from "./types";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { ProfileForm } from "./components/ProfileForm";
import { MatchResults } from "./components/MatchResults";
import { Footer } from "./components/Footer";

const API_BASE_URL =
  (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Step = "profile" | "results";

function App() {
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  const handleSubmitProfile = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setLoading(true);

      const formData = new FormData(event.currentTarget);

      const profile: StudentProfile = {
        full_name: String(formData.get("full_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        age: Number(formData.get("age") ?? 0),
        region: String(formData.get("region") ?? ""),
        school: String(formData.get("school") ?? ""),
        needs: String(formData.get("needs") ?? "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean)
      };

      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/v1/profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(profile)
        });

        if (!profileRes.ok) {
          const data = await profileRes.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to create profile");
        }

        const created = await profileRes.json();

        const matchesRes = await fetch(
          `${API_BASE_URL}/api/v1/matches/${created.id}`
        );
        if (!matchesRes.ok) {
          throw new Error("Unable to fetch matches");
        }
        const matchData = await matchesRes.json();
        setMatches(matchData.matches ?? []);
        setStep("results");
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const scrollToProfile = useCallback(() => {
    document.getElementById("profile")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const resetToProfile = useCallback(() => {
    setStep("profile");
    setMatches([]);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="bg-slate-50">
        {step === "profile" && (
          <>
            <HeroSection onCtaClick={scrollToProfile} />
            <ProfileForm
              onSubmit={handleSubmitProfile}
              loading={loading}
              error={error}
            />
          </>
        )}
        {step === "results" && (
          <MatchResults matches={matches} onReset={resetToProfile} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
