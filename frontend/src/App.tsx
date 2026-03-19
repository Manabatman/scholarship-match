import { FormEvent, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import type { StudentProfile } from "./types";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { ProfileForm } from "./components/ProfileForm";
import { MatchResultsPage } from "./pages/MatchResultsPage";
import { ScholarshipDetailPage } from "./pages/ScholarshipDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ChangelogPage } from "./pages/ChangelogPage";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfileDashboard } from "./pages/ProfileDashboard";
import { MatchComparisonPage } from "./pages/MatchComparisonPage";
import { ScholarshipList } from "./components/ScholarshipList";
import { ScholarshipSearchPage } from "./pages/ScholarshipSearchPage";
import { Footer } from "./components/Footer";
import { SavedScholarshipsProvider } from "./contexts/SavedScholarshipsContext";
import { apiFetch } from "./api/client";

function profileToInitialValues(p: { id?: number; [key: string]: unknown }): Record<string, string> {
  const pc = (p.preferred_courses as string[]) ?? [];
  return {
    full_name: String(p.full_name ?? ""),
    email: String(p.email ?? ""),
    age: p.age != null ? String(p.age) : "",
    gender: String(p.gender ?? ""),
    region: String(p.region ?? ""),
    province: String(p.province ?? ""),
    city_municipality: String(p.city_municipality ?? ""),
    barangay: String(p.barangay ?? ""),
    school: String(p.school ?? ""),
    school_type: String(p.school_type ?? ""),
    target_school: String(p.target_school ?? ""),
    education_level: String(p.education_level ?? ""),
    current_academic_stage: String(p.current_academic_stage ?? ""),
    target_academic_year: String(p.target_academic_year ?? ""),
    field_of_study_broad: String(p.field_of_study_broad ?? ""),
    field_of_study_specific: String(p.field_of_study_specific ?? ""),
    preferred_course_1: pc[0] ?? "",
    preferred_course_2: pc[1] ?? "",
    preferred_course_3: pc[2] ?? "",
    gwa_raw: String(p.gwa_raw ?? ""),
    gwa_scale: String(p.gwa_scale ?? ""),
    needs: Array.isArray(p.needs) ? p.needs.join(", ") : "",
    extracurriculars: Array.isArray(p.extracurriculars) ? p.extracurriculars.join(", ") : "",
    awards: Array.isArray(p.awards) ? p.awards.join(", ") : "",
    household_income_annual: p.household_income_annual != null ? String(p.household_income_annual) : "",
    income_bracket: String(p.income_bracket ?? ""),
    parent_occupation: String(p.parent_occupation ?? ""),
    is_underprivileged: (p as { is_underprivileged?: boolean }).is_underprivileged ? "on" : "",
    is_pwd: (p as { is_pwd?: boolean }).is_pwd ? "on" : "",
    is_indigenous_people: (p as { is_indigenous_people?: boolean }).is_indigenous_people ? "on" : "",
    is_solo_parent_dependent: (p as { is_solo_parent_dependent?: boolean }).is_solo_parent_dependent ? "on" : "",
    is_ofw_dependent: (p as { is_ofw_dependent?: boolean }).is_ofw_dependent ? "on" : "",
    is_farmer_fisher_dependent: (p as { is_farmer_fisher_dependent?: boolean }).is_farmer_fisher_dependent ? "on" : "",
    is_4ps_listahanan: (p as { is_4ps_listahanan?: boolean }).is_4ps_listahanan ? "on" : "",
  };
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, authHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    if (!user) {
      setInitialValues(undefined);
      return;
    }
    apiFetch("/api/v1/profiles", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => {
        if (Array.isArray(arr) && arr.length > 0) {
          setInitialValues(profileToInitialValues(arr[0]));
        } else {
          setInitialValues(undefined);
        }
      })
      .catch(() => setInitialValues(undefined));
  }, [user, authHeaders]);

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
      const preferredCourses = [getStr("preferred_course_1"), getStr("preferred_course_2"), getStr("preferred_course_3")].filter(Boolean);

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
        field_of_study_specific: preferredCourses[0] ?? getStr("field_of_study_specific"),
        preferred_courses: preferredCourses,
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
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const authHdrs = authHeaders();
        Object.assign(headers, authHdrs);
        const profileRes = await apiFetch("/api/v1/profiles", {
          method: "POST",
          headers,
          body: JSON.stringify(profile),
        });

        if (!profileRes.ok) {
          const data = await profileRes.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to create profile");
        }

        const created = await profileRes.json();
        localStorage.removeItem("iskonnect_profile_draft");
        navigate(`/match/${created.id}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [navigate, authHeaders]
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProfileDashboard />} />
      <Route path="/match-compare" element={<MatchComparisonPage />} />
      <Route path="/scholarship/:id" element={<ScholarshipDetailPage />} />
      <Route path="/scholarships/search" element={<ScholarshipSearchPage />} />
      <Route path="/scholarships" element={<ScholarshipList />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/changelog" element={<ChangelogPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

function AppLayout() {
  return (
    <SavedScholarshipsProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="bg-slate-50 dark:bg-slate-900">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </SavedScholarshipsProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
