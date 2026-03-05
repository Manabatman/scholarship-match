"""
Hard filter service - deal-breakers that exclude scholarships before scoring.
If any hard filter fails, the scholarship is not shown.
"""

import json
from app.taxonomy.regions import normalize_region


def _parse_json_list(val: str | list | None) -> list:
    """Parse JSON list from string or return list as-is."""
    if val is None:
        return []
    if isinstance(val, list):
        return [str(x).strip() for x in val if x]
    if isinstance(val, str):
        try:
            parsed = json.loads(val)
            return [str(x).strip() for x in parsed if x] if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return [x.strip() for x in val.split(",") if x.strip()]
    return []


def _level_matches(profile_level: str | None, eligible_levels: list, legacy_level: str | None) -> bool:
    """Check if profile education level matches scholarship eligibility."""
    if not profile_level or not profile_level.strip():
        return True  # No filter if profile has no level
    profile_lower = profile_level.strip().lower()

    # Map legacy level names to broader categories
    level_map = {
        "high school": ["high school", "grade 11", "grade 12"],
        "college": ["college", "college 1st year", "college 2nd year", "college 3rd year", "college 4th year"],
        "tvet": ["tvet", "vocational"],
        "graduate": ["graduate", "master's", "phd", "doctoral"],
    }

    levels_to_check = eligible_levels if eligible_levels else ([legacy_level] if legacy_level else [])
    if not levels_to_check:
        return True

    for el in levels_to_check:
        el_lower = str(el).strip().lower()
        if profile_lower == el_lower:
            return True
        # Check broad category
        for broad, variants in level_map.items():
            if el_lower == broad and profile_lower in variants:
                return True
            if profile_lower == broad and el_lower in variants:
                return True
    return False


def _region_matches(
    profile_region: str | None,
    profile_city: str | None,
    eligible_regions: list,
    eligible_cities: list,
    residency_required: bool,
    legacy_regions: list,
) -> bool:
    """Check if profile location matches scholarship geographic eligibility."""
    regions = eligible_regions if eligible_regions else legacy_regions
    if not regions and not eligible_cities:
        return True  # Nationwide

    profile_region_norm = normalize_region(profile_region or "")
    profile_city_lower = (profile_city or "").strip().lower()

    # City-level match (LGU)
    if eligible_cities:
        for ec in eligible_cities:
            if ec and profile_city_lower and ec.strip().lower() in profile_city_lower:
                return True
            if ec and profile_city_lower and profile_city_lower in ec.strip().lower():
                return True

    # Region-level match
    for r in regions:
        if not r:
            continue
        r_norm = normalize_region(r)
        if profile_region_norm and (
            profile_region_norm in r_norm or r_norm in profile_region_norm or profile_region_norm == r_norm
        ):
            return True
        if profile_region and r and (
            profile_region.lower() in r.lower() or r.lower() in (profile_region or "").lower()
        ):
            return True

    return False


def _age_matches(profile_age: int | None, min_age: int | None, max_age: int | None) -> bool:
    """Check if profile age is within scholarship range."""
    if profile_age is None:
        return True
    if min_age is not None and profile_age < min_age:
        return False
    if max_age is not None and profile_age > max_age:
        return False
    return True


def _school_type_matches(profile_school_type: str | None, eligible_school_types: list) -> bool:
    """Check if profile school type is eligible."""
    if not eligible_school_types:
        return True
    if not profile_school_type or not profile_school_type.strip():
        return True
    profile_st = profile_school_type.strip().lower()
    for st in eligible_school_types:
        if st and st.strip().lower() == profile_st:
            return True
    return True  # Default allow if no strict filter


def _income_matches(
    profile_income: int | None,
    profile_bracket: str | None,
    max_income_threshold: int | None,
) -> bool:
    """Check if profile income is below scholarship ceiling."""
    if max_income_threshold is None:
        return True
    if profile_income is not None and profile_income <= max_income_threshold:
        return True
    # Fallback: use bracket if income not provided
    if profile_bracket == "below_250k" and max_income_threshold >= 250_000:
        return True
    if profile_bracket == "250k_400k" and max_income_threshold >= 400_000:
        return True
    if profile_bracket == "400k_500k" and max_income_threshold >= 500_000:
        return True
    if profile_income is None:
        return True  # Cannot disqualify without data
    return False


def _gwa_matches(profile_gwa: float | None, min_gwa_required: float | None) -> bool:
    """Check if profile GWA meets minimum."""
    if min_gwa_required is None:
        return True
    if profile_gwa is None:
        return True  # Cannot disqualify without data
    return profile_gwa >= min_gwa_required


def _field_matches(profile_field_broad: str | None, eligible_courses_psced: list) -> bool:
    """Check if profile field of study matches scholarship course eligibility."""
    if not eligible_courses_psced:
        return True
    if not profile_field_broad or not profile_field_broad.strip():
        return True
    profile_f = profile_field_broad.strip().lower()
    for ec in eligible_courses_psced:
        if ec and ec.strip().lower() in profile_f:
            return True
        if ec and profile_f in ec.strip().lower():
            return True
    return False


def filter_scholarships(profile: dict, scholarships: list) -> list:
    """
    Return only scholarships that pass all hard filters.
    profile and scholarships are dicts (from API/DB layer).
    """
    result = []
    for sch in scholarships:
        if not _age_matches(
            profile.get("age"),
            sch.get("min_age"),
            sch.get("max_age"),
        ):
            continue
        if not _level_matches(
            profile.get("education_level") or profile.get("current_academic_stage"),
            _parse_json_list(sch.get("eligible_levels") or sch.get("level")),
            sch.get("level"),
        ):
            continue
        if not _region_matches(
            profile.get("region"),
            profile.get("city_municipality"),
            _parse_json_list(sch.get("eligible_regions")),
            _parse_json_list(sch.get("eligible_cities")),
            sch.get("residency_required", False),
            _parse_json_list(sch.get("regions")),
        ):
            continue
        if not _school_type_matches(
            profile.get("school_type"),
            _parse_json_list(sch.get("eligible_school_types")),
        ):
            continue
        if not _income_matches(
            profile.get("household_income_annual"),
            profile.get("income_bracket"),
            sch.get("max_income_threshold"),
        ):
            continue
        if not _gwa_matches(
            profile.get("gwa_normalized"),
            sch.get("min_gwa_normalized"),
        ):
            continue
        if not _field_matches(
            profile.get("field_of_study_broad"),
            _parse_json_list(sch.get("eligible_courses_psced")),
        ):
            continue
        result.append(sch)
    return result
