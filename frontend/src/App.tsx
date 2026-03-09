import { FormEvent, useCallback, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import type { StudentProfile } from "./types";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { ProfileForm } from "./components/ProfileForm";
import { MatchResultsPage } from "./pages/MatchResultsPage";
import { AdminPage } from "./pages/AdminPage";
import { ScholarshipList } from "./components/ScholarshipList";
import { Footer } from "./components/Footer";

const API_BASE_URL =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ?? "http://localhost:8000";

function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitProfile = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setLoading(true);

      const formData = new FormData(event.currentTarget);

      const getStr = (k: string) => String(formData.get(k) ?? "").trim() || undefined;
      const getNum = (k: string) => {
        const v = formData.get(k);
        if (v === null || v === "") return undefined;
        const n = Number(v);
        return isNaN(n) ? undefined : n;
      };
      const getBool = (k: string) => formData.get(k) === "on";
      const getList = (k: string) =>
        String(formData.get(k) ?? "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);

      const profile: StudentProfile = {
        full_name: String(formData.get("full_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        age: getNum("age"),
        region: getStr("region"),
        school: getStr("school"),
        needs: getList("needs"),
        education_level: getStr("education_level"),
        gender: getStr("gender"),
        current_academic_stage: getStr("current_academic_stage"),
        target_academic_year: getStr("target_academic_year"),
        province: getStr("province"),
        city_municipality: getStr("city_municipality"),
        barangay: getStr("barangay"),
        school_type: getStr("school_type"),
        target_school: getStr("target_school"),
        gwa_raw: getStr("gwa_raw"),
        gwa_scale: getStr("gwa_scale"),
        field_of_study_broad: getStr("field_of_study_broad"),
        field_of_study_specific: getStr("field_of_study_specific"),
        extracurriculars: getList("extracurriculars"),
        awards: getList("awards"),
        household_income_annual: getNum("household_income_annual"),
        income_bracket: getStr("income_bracket"),
        is_underprivileged: getBool("is_underprivileged"),
        is_pwd: getBool("is_pwd"),
        is_indigenous_people: getBool("is_indigenous_people"),
        is_solo_parent_dependent: getBool("is_solo_parent_dependent"),
        is_ofw_dependent: getBool("is_ofw_dependent"),
        is_farmer_fisher_dependent: getBool("is_farmer_fisher_dependent"),
        is_4ps_listahanan: getBool("is_4ps_listahanan"),
        parent_occupation: getStr("parent_occupation"),
      };

      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/v1/profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });

        if (!profileRes.ok) {
          const data = await profileRes.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to create profile");
        }

        const created = await profileRes.json();
        navigate(`/match/${created.id}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const scrollToProfile = useCallback(() => {
    document.getElementById("profile")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <HeroSection onCtaClick={scrollToProfile} />
      <ProfileForm onSubmit={handleSubmitProfile} loading={loading} error={error} />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProfilePage />} />
      <Route path="/match/:profileId" element={<MatchResultsPage />} />
      <Route path="/scholarships" element={<ScholarshipList />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="bg-slate-50">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
