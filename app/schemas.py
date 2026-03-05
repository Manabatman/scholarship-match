from datetime import date
from pydantic import BaseModel
from typing import List, Optional, Any


# === Match Breakdown (Structure Only) ===
class MatchFactorSchema(BaseModel):
    category: Optional[str] = None
    status: str  # met, exceeded, partial, missing, disqualified
    user_value: str
    requirement_value: str
    detail: Optional[str] = None


class MatchBreakdownSchema(BaseModel):
    academic: Optional[dict] = None
    socioeconomic: Optional[dict] = None
    field_relevance: Optional[dict] = None
    geographic: Optional[dict] = None
    document_readiness: Optional[dict] = None
    priority_group: Optional[dict] = None


# === Student Profile ===
class StudentProfile(BaseModel):
    full_name: str
    email: str
    age: Optional[int] = None
    region: Optional[str] = None
    school: Optional[str] = None
    needs: Optional[List[str]] = []
    education_level: Optional[str] = None
    # New fields
    gender: Optional[str] = None
    birthdate: Optional[date] = None
    current_academic_stage: Optional[str] = None
    target_academic_year: Optional[str] = None
    province: Optional[str] = None
    city_municipality: Optional[str] = None
    barangay: Optional[str] = None
    school_type: Optional[str] = None
    target_school: Optional[str] = None
    gwa_raw: Optional[str] = None
    gwa_scale: Optional[str] = None
    gwa_normalized: Optional[float] = None
    field_of_study_broad: Optional[str] = None
    field_of_study_specific: Optional[str] = None
    extracurriculars: Optional[List[str]] = []
    awards: Optional[List[str]] = []
    household_income_annual: Optional[int] = None
    income_bracket: Optional[str] = None
    is_underprivileged: Optional[bool] = False
    is_pwd: Optional[bool] = False
    is_indigenous_people: Optional[bool] = False
    ip_tribe_name: Optional[str] = None
    is_solo_parent_dependent: Optional[bool] = False
    is_ofw_dependent: Optional[bool] = False
    ofw_parent_type: Optional[str] = None
    is_farmer_fisher_dependent: Optional[bool] = False
    is_4ps_listahanan: Optional[bool] = False
    parent_occupation: Optional[str] = None
    documents: Optional[List[dict]] = []


class StudentProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    age: Optional[int] = None
    region: Optional[str] = None
    school: Optional[str] = None
    needs: Optional[List[str]] = []
    education_level: Optional[str] = None
    gender: Optional[str] = None
    birthdate: Optional[date] = None
    current_academic_stage: Optional[str] = None
    target_academic_year: Optional[str] = None
    province: Optional[str] = None
    city_municipality: Optional[str] = None
    barangay: Optional[str] = None
    school_type: Optional[str] = None
    target_school: Optional[str] = None
    gwa_raw: Optional[str] = None
    gwa_scale: Optional[str] = None
    gwa_normalized: Optional[float] = None
    field_of_study_broad: Optional[str] = None
    field_of_study_specific: Optional[str] = None
    extracurriculars: Optional[List[str]] = []
    awards: Optional[List[str]] = []
    household_income_annual: Optional[int] = None
    income_bracket: Optional[str] = None
    is_underprivileged: Optional[bool] = False
    is_pwd: Optional[bool] = False
    is_indigenous_people: Optional[bool] = False
    ip_tribe_name: Optional[str] = None
    is_solo_parent_dependent: Optional[bool] = False
    is_ofw_dependent: Optional[bool] = False
    ofw_parent_type: Optional[str] = None
    is_farmer_fisher_dependent: Optional[bool] = False
    is_4ps_listahanan: Optional[bool] = False
    parent_occupation: Optional[str] = None
    documents: Optional[List[dict]] = []

    class Config:
        from_attributes = True


# === Scholarship ===
class Scholarship(BaseModel):
    title: str
    provider: Optional[str] = None
    countries: Optional[List[str]] = []
    regions: Optional[List[str]] = []
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    needs_tags: Optional[List[str]] = []
    level: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    provider_type: Optional[str] = None
    scholarship_type: Optional[str] = None
    eligible_levels: Optional[List[str]] = []
    eligible_regions: Optional[List[str]] = []
    eligible_cities: Optional[List[str]] = []
    residency_required: Optional[bool] = False
    eligible_school_types: Optional[List[str]] = []
    eligible_courses_psced: Optional[List[str]] = []
    eligible_courses_specific: Optional[List[str]] = []
    max_income_threshold: Optional[int] = None
    min_gwa_normalized: Optional[float] = None
    priority_groups: Optional[List[str]] = []
    preferred_extracurriculars: Optional[List[str]] = []
    preferred_awards: Optional[List[str]] = []
    benefit_tuition: Optional[bool] = False
    benefit_allowance_monthly: Optional[int] = None
    benefit_books: Optional[bool] = False
    benefit_miscellaneous: Optional[str] = None
    benefit_total_value: Optional[int] = None
    required_documents: Optional[List[str]] = []
    has_qualifying_exam: Optional[bool] = False
    has_interview: Optional[bool] = False
    has_essay_requirement: Optional[bool] = False
    has_return_service: Optional[bool] = False
    application_deadline: Optional[date] = None
    application_open_date: Optional[date] = None
    academic_year_target: Optional[str] = None
    is_active: Optional[bool] = True


class ScholarshipResponse(BaseModel):
    id: int
    title: str
    provider: Optional[str] = None
    countries: Optional[List[str]] = []
    regions: Optional[List[str]] = []
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    needs_tags: Optional[List[str]] = []
    level: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    provider_type: Optional[str] = None
    scholarship_type: Optional[str] = None
    eligible_levels: Optional[List[str]] = []
    eligible_regions: Optional[List[str]] = []
    eligible_cities: Optional[List[str]] = []
    residency_required: Optional[bool] = False
    eligible_school_types: Optional[List[str]] = []
    eligible_courses_psced: Optional[List[str]] = []
    max_income_threshold: Optional[int] = None
    min_gwa_normalized: Optional[float] = None
    priority_groups: Optional[List[str]] = []
    benefit_tuition: Optional[bool] = False
    benefit_allowance_monthly: Optional[int] = None
    benefit_books: Optional[bool] = False
    benefit_total_value: Optional[int] = None
    required_documents: Optional[List[str]] = []
    has_qualifying_exam: Optional[bool] = False
    has_interview: Optional[bool] = False
    has_essay_requirement: Optional[bool] = False
    has_return_service: Optional[bool] = False
    application_deadline: Optional[date] = None
    application_open_date: Optional[date] = None
    academic_year_target: Optional[str] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True


# === Match Response (Expanded) ===
class MatchResponse(BaseModel):
    id: int
    title: str
    provider: Optional[str] = None
    score: float
    final_score: Optional[float] = None
    eligibility_status: Optional[bool] = None
    readiness_score: Optional[float] = None
    explanation: Optional[List[str]] = []
    breakdown: Optional[dict] = None
    confidence: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    regions: Optional[List[str]] = []
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    level: Optional[str] = None
    provider_type: Optional[str] = None
    scholarship_type: Optional[str] = None
    benefit_tuition: Optional[bool] = None
    benefit_allowance_monthly: Optional[int] = None
    benefit_books: Optional[bool] = None
    benefit_total_value: Optional[int] = None
    application_deadline: Optional[str] = None
    required_documents: Optional[List[str]] = []
