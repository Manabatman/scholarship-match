export interface StudentProfile {
  full_name: string;
  email: string;
  age: number;
  region: string;
  school: string;
  needs: string[];
  education_level?: string;
}

export interface MatchResult {
  id: number;
  title: string;
  provider: string;
  score: number;
  link: string | null;
  description: string;
  regions: string[];
  min_age: number | null;
  max_age: number | null;
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
}
