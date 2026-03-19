from sqlalchemy import Column, Integer, String, Text, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db import Base


class User(Base):
    """User account for authentication."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, server_default="student")  # "student" | "admin"


class Student(Base):
    """Student profile with policy-aligned eligibility fields."""

    __tablename__ = "students"

    # === CORE IDENTITY ===
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)

    # === HARD FILTER FIELDS (deal-breakers) ===
    education_level = Column(String)  # Grade 11, Grade 12, College 1st Year, etc.
    current_academic_stage = Column(String)  # Junior HS, Senior HS, Undergraduate, Postgraduate, TVET, ALS
    target_academic_year = Column(String)  # e.g. 2026-2027
    region = Column(String)
    province = Column(String)
    city_municipality = Column(String)
    barangay = Column(String)
    school_type = Column(String)  # Public | Private

    # === SCORING INPUT FIELDS (continuous/ranked signals) ===
    school = Column(String)
    target_school = Column(String)
    gwa_raw = Column(String)  # Raw input: e.g. "1.25" or "94" or "3.8"
    gwa_scale = Column(String)  # 5.0_scale | 4.0_scale | percentage
    gwa_normalized = Column(Float)  # 0-100 normalized percentage
    field_of_study_broad = Column(String)  # PSCED broad discipline code
    field_of_study_specific = Column(String)  # Specific course/major name (legacy; first of preferred_courses)
    preferred_courses = Column(Text)  # JSON list of up to 3 course names, e.g. ["BS Computer Science", "BS IT"]
    extracurriculars = Column(Text)  # JSON list
    awards = Column(Text)  # JSON list

    # === EQUITY CLASSIFICATION FLAGS (RA-based) ===
    household_income_annual = Column(Integer)
    income_bracket = Column(String)  # below_250k | 250k_400k | 400k_500k | above_500k
    is_underprivileged = Column(Boolean, default=False)
    is_pwd = Column(Boolean, default=False)
    is_indigenous_people = Column(Boolean, default=False)
    ip_tribe_name = Column(String)
    is_solo_parent_dependent = Column(Boolean, default=False)
    is_ofw_dependent = Column(Boolean, default=False)
    ofw_parent_type = Column(String)  # land_based | sea_based | null
    is_farmer_fisher_dependent = Column(Boolean, default=False)
    is_4ps_listahanan = Column(Boolean, default=False)
    parent_occupation = Column(String)

    # === DOCUMENT INVENTORY (readiness tracking) ===
    documents = Column(Text)  # JSON: [{"type": "ITR", "status": "uploaded"}, ...]

    # === METADATA ===
    age = Column(Integer)
    gender = Column(String)
    birthdate = Column(Date)
    profile_completeness = Column(Float)
    needs = Column(Text)  # JSON-encoded list (legacy)


class Scholarship(Base):
    """Scholarship with policy-aligned eligibility and benefit fields."""

    __tablename__ = "scholarships"

    # === CORE ===
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    provider = Column(String)
    source = Column(String)  # Data provenance: "philscholar", "sikap", etc.
    link = Column(String)
    description = Column(Text)
    countries = Column(String)  # CSV string (legacy)

    # === HARD FILTER FIELDS (must-match or score=0) ===
    regions = Column(String)  # CSV string (legacy)
    eligible_levels = Column(Text)  # JSON list: ["College", "Graduate"]
    eligible_regions = Column(Text)  # JSON list
    eligible_cities = Column(Text)  # JSON list for LGU-specific grants
    residency_required = Column(Boolean, default=False)
    eligible_school_types = Column(Text)  # JSON: ["Public", "Private"]
    eligible_courses_psced = Column(Text)  # JSON list of PSCED broad codes
    eligible_courses_specific = Column(Text)  # JSON list of specific course names
    citizenship_required = Column(String, default="Filipino")
    max_income_threshold = Column(Integer)
    min_gwa_normalized = Column(Float)
    min_age = Column(Integer)
    max_age = Column(Integer)

    # === SCORING INPUT FIELDS (for weighted evaluation) ===
    provider_type = Column(String)  # Government | Private | LGU | Institutional
    scholarship_type = Column(String)  # Merit | Need | Merit-and-Need | Affiliation
    priority_groups = Column(Text)  # JSON list
    preferred_extracurriculars = Column(Text)  # JSON list
    preferred_awards = Column(Text)  # JSON list

    # === BENEFIT PACKAGE (display + scoring context) ===
    benefit_tuition = Column(Boolean, default=False)
    benefit_allowance_monthly = Column(Integer)
    benefit_books = Column(Boolean, default=False)
    benefit_miscellaneous = Column(Text)
    benefit_total_value = Column(Integer)

    # === DOCUMENT REQUIREMENTS ===
    required_documents = Column(Text)  # JSON list
    has_qualifying_exam = Column(Boolean, default=False)
    has_interview = Column(Boolean, default=False)
    has_essay_requirement = Column(Boolean, default=False)
    has_return_service = Column(Boolean, default=False)

    # === TIMELINE ===
    application_deadline = Column(Date)
    application_open_date = Column(Date)
    academic_year_target = Column(String)

    # === METADATA ===
    is_active = Column(Boolean, default=True)
    level = Column(String)  # Legacy: High School, College, TVET, Graduate
    needs_tags = Column(Text)  # JSON-encoded list (legacy)


class MatchRun(Base):
    """A single match run for a user's profile."""

    __tablename__ = "match_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class MatchResult(Base):
    """One scholarship result within a match run."""

    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("match_runs.id"), nullable=False, index=True)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)  # JSON-encoded list
    breakdown = Column(Text, nullable=True)  # JSON-encoded dict
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
