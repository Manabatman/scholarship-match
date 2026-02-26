export interface StudentProfile {
  full_name: string;
  email: string;
  age: number;
  region: string;
  school: string;
  needs: string[];
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
