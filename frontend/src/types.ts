export interface StudentProfile {
  full_name: string;
  email: string;
  age?: number;
  region?: string;
  school?: string;
  needs?: string[];
  education_level?: string;
  gender?: string;
  birthdate?: string;
  current_academic_stage?: string;
  target_academic_year?: string;
  province?: string;
  city_municipality?: string;
  barangay?: string;
  school_type?: string;
  target_school?: string;
  gwa_raw?: string;
  gwa_scale?: string;
  gwa_normalized?: number;
  field_of_study_broad?: string;
  field_of_study_specific?: string;
  extracurriculars?: string[];
  awards?: string[];
  household_income_annual?: number;
  income_bracket?: string;
  is_underprivileged?: boolean;
  is_pwd?: boolean;
  is_indigenous_people?: boolean;
  ip_tribe_name?: string;
  is_solo_parent_dependent?: boolean;
  is_ofw_dependent?: boolean;
  ofw_parent_type?: string;
  is_farmer_fisher_dependent?: boolean;
  is_4ps_listahanan?: boolean;
  parent_occupation?: string;
  documents?: Array<{ type: string; status: string }>;
}

export interface MatchFactorBreakdown {
  status: string;
  user_value: string;
  requirement_value: string;
  detail?: string;
}

export interface MatchBreakdown {
  academic?: MatchFactorBreakdown;
  socioeconomic?: MatchFactorBreakdown;
  field_relevance?: MatchFactorBreakdown;
  geographic?: MatchFactorBreakdown;
  document_readiness?: MatchFactorBreakdown;
  priority_group?: MatchFactorBreakdown;
}

export interface MatchResult {
  id: number;
  title: string;
  provider: string;
  score: number;
  final_score?: number;
  eligibility_status?: boolean;
  readiness_score?: number;
  explanation?: string[];
  breakdown?: MatchBreakdown;
  confidence?: string;
  link: string | null;
  description: string;
  regions: string[];
  min_age: number | null;
  max_age: number | null;
  level?: string | null;
  provider_type?: string | null;
  scholarship_type?: string | null;
  benefit_tuition?: boolean;
  benefit_allowance_monthly?: number | null;
  benefit_books?: boolean;
  benefit_total_value?: number | null;
  application_deadline?: string | null;
  required_documents?: string[];
}

export interface ScholarshipInfo {
  id: number;
  title: string;
  provider: string;
  link: string | null;
  description: string;
  regions: string[];
  min_age: number | null;
  max_age: number | null;
  level?: string | null;
  provider_type?: string | null;
  scholarship_type?: string | null;
  benefit_tuition?: boolean;
  benefit_allowance_monthly?: number | null;
  benefit_books?: boolean;
  benefit_total_value?: number | null;
  application_deadline?: string | null;
  is_active?: boolean;
}
