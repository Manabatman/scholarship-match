"""
Match service - orchestrates hard filtering, scoring, and result assembly.
"""

import json
import logging

logger = logging.getLogger(__name__)
from app.matching.hard_filters import filter_scholarships
from app.matching.scoring_port import ScoringEnginePort, ScoringPayload, ScoringResult
from app.scoring import WeightedDeterministicScorer
from app.taxonomy.regions import normalize_region
from app.taxonomy.income_brackets import get_income_bracket
from app.documents.readiness import compute_readiness


def _parse_json_list(val, default=None):
    if val is None:
        return default or []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            p = json.loads(val)
            return p if isinstance(p, list) else (default or [])
        except (json.JSONDecodeError, TypeError):
            return [x.strip() for x in val.split(",") if x.strip()] or (default or [])
    return default or []


def _get_field_match_level(
    profile_field_broad: str | None,
    profile_field_specific: str | None,
    profile_preferred_courses: list,
    profile_needs: list,
    eligible_psced: list,
    eligible_specific: list,
    needs_tags: list,
) -> str:
    """Determine field match level: exact, broad, partial, none.
    Uses FIELD_HIERARCHY so e.g. Engineering matches STEM-eligible scholarships as 'broad'."""
    from app.taxonomy.psced_fields import FIELD_HIERARCHY

    eligible_psced = [str(x).strip().lower() for x in (eligible_psced or []) if x]
    eligible_specific = [str(x).strip().lower() for x in (eligible_specific or []) if x]
    needs_tags = [str(x).strip().lower() for x in (needs_tags or []) if x]
    profile_broad = (profile_field_broad or "").strip().lower()
    profile_specific = (profile_field_specific or "").strip().lower()
    profile_needs = [str(x).strip().lower() for x in (profile_needs or []) if x]

    profile_fields_to_check = [profile_broad] if profile_broad else []
    if profile_field_broad:
        parents = FIELD_HIERARCHY.get(profile_field_broad.strip())
        if parents:
            profile_fields_to_check.extend(p.strip().lower() for p in parents)

    preferred_courses = [str(x).strip().lower() for x in (profile_preferred_courses or []) if x]

    if profile_fields_to_check and eligible_psced:
        for pf in profile_fields_to_check:
            if pf in eligible_psced:
                return "exact"
        for pf in profile_fields_to_check:
            for ep in eligible_psced:
                if ep in pf or pf in ep:
                    return "broad"
    courses_to_check = preferred_courses or ([profile_specific] if profile_specific else [])
    for course in courses_to_check:
        if course and eligible_specific and (course in eligible_specific or any(es in course for es in eligible_specific)):
            return "exact"
    if profile_specific and eligible_specific:
        if profile_specific in eligible_specific or any(ps in profile_specific for ps in eligible_specific):
            return "exact"
    if profile_needs and needs_tags:
        for pn in profile_needs:
            for nt in needs_tags:
                if pn in nt or nt in pn:
                    return "broad"
    if profile_broad or profile_needs:
        return "partial"
    return "none"


def _get_geographic_match_level(
    profile_region: str | None,
    profile_city: str | None,
    eligible_regions: list,
    eligible_cities: list,
    legacy_regions: list,
) -> str:
    """Determine geographic match level: city, region, island_group, none."""
    regions = eligible_regions or legacy_regions or []
    profile_region_norm = normalize_region(profile_region or "")
    profile_city_lower = (profile_city or "").strip().lower()

    if eligible_cities and profile_city_lower:
        for ec in eligible_cities:
            if ec and (ec.strip().lower() in profile_city_lower or profile_city_lower in ec.strip().lower()):
                return "city"

    for r in regions:
        if not r:
            continue
        r_norm = normalize_region(r)
        if profile_region_norm and (
            profile_region_norm == r_norm or profile_region_norm in r_norm or r_norm in profile_region_norm
        ):
            return "region"
        if profile_region and r and (profile_region.lower() in r.lower() or r.lower() in profile_region.lower()):
            return "region"

    # Island group fallback
    island_groups = {"metro manila": "luzon", "luzon": "luzon", "visayas": "visayas", "mindanao": "mindanao"}
    if profile_region_norm in island_groups:
        for r in regions:
            r_norm = normalize_region(r)
            if island_groups.get(r_norm) == island_groups.get(profile_region_norm):
                return "island_group"

    return "none"


def _get_equity_flags(profile: dict) -> dict[str, bool]:
    """Extract equity flags from profile for payload."""
    return {
        "is_underprivileged": bool(profile.get("is_underprivileged")),
        "is_pwd": bool(profile.get("is_pwd")),
        "is_indigenous_people": bool(profile.get("is_indigenous_people")),
        "is_solo_parent_dependent": bool(profile.get("is_solo_parent_dependent")),
        "is_ofw_dependent": bool(profile.get("is_ofw_dependent")),
        "is_farmer_fisher_dependent": bool(profile.get("is_farmer_fisher_dependent")),
        "is_4ps_listahanan": bool(profile.get("is_4ps_listahanan")),
        "underprivileged": bool(profile.get("is_underprivileged")),
        "pwd": bool(profile.get("is_pwd")),
        "ip": bool(profile.get("is_indigenous_people")),
        "solo_parent_dependent": bool(profile.get("is_solo_parent_dependent")),
        "ofw_dependent": bool(profile.get("is_ofw_dependent")),
        "4ps_listahanan": bool(profile.get("is_4ps_listahanan")),
    }


def _count_matches(profile_list: list, scholarship_list: list) -> int:
    """Count overlapping items (case-insensitive substring match)."""
    if not profile_list or not scholarship_list:
        return 0
    count = 0
    for p in profile_list:
        p_lower = str(p).lower()
        for s in scholarship_list:
            if s and (p_lower in str(s).lower() or str(s).lower() in p_lower):
                count += 1
                break
    return count


class MatchService:
    """Orchestrates hard filter -> score -> explain -> rank."""

    def __init__(self, scoring_engine: ScoringEnginePort | None = None):
        self.scoring_engine = scoring_engine or WeightedDeterministicScorer()

    def get_matches(self, profile: dict, scholarships: list) -> list[dict]:
        """
        Return ranked match results with breakdown and explanation.
        profile and scholarships are dicts (from API/DB).
        """
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("match_service: filter input scholarships=%d", len(scholarships))

        candidates = filter_scholarships(profile, scholarships)

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("match_service: after hard filters candidates=%d", len(candidates))

        results = []

        for sch in candidates:
            payload = self._build_scoring_payload(profile, sch)
            scoring_result = self.scoring_engine.score(payload)
            match_result = self._build_match_result(sch, scoring_result)
            results.append(match_result)

        results.sort(key=lambda m: m.get("final_score", 0), reverse=True)

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("match_service: scored results=%d", len(results))

        return results

    def _build_scoring_payload(self, profile: dict, scholarship: dict) -> ScoringPayload:
        """Build ScoringPayload from profile and scholarship dicts."""
        eligible_levels = _parse_json_list(scholarship.get("eligible_levels"))
        legacy_level = scholarship.get("level")
        profile_level = profile.get("education_level") or profile.get("current_academic_stage")
        age = profile.get("age")
        min_age = scholarship.get("min_age")
        max_age = scholarship.get("max_age")
        age_ok = (min_age is None or age is None or age >= min_age) and (
            max_age is None or age is None or age <= max_age
        )

        profile_school_type = (profile.get("school_type") or "").strip().lower()
        eligible_school_types = _parse_json_list(scholarship.get("eligible_school_types"))
        school_match = not eligible_school_types or not profile_school_type or any(
            (st or "").strip().lower() == profile_school_type for st in eligible_school_types
        )

        income = profile.get("household_income_annual")
        if income is None and profile.get("income_bracket"):
            pass  # Keep income as None, bracket is separate
        income_bracket = profile.get("income_bracket") or (get_income_bracket(income) if income is not None else None)

        field_match = _get_field_match_level(
            profile.get("field_of_study_broad"),
            profile.get("field_of_study_specific"),
            _parse_json_list(profile.get("preferred_courses")),
            _parse_json_list(profile.get("needs")),
            _parse_json_list(scholarship.get("eligible_courses_psced")),
            _parse_json_list(scholarship.get("eligible_courses_specific")),
            _parse_json_list(scholarship.get("needs_tags")),
        )

        geo_match = _get_geographic_match_level(
            profile.get("region"),
            profile.get("city_municipality"),
            _parse_json_list(scholarship.get("eligible_regions")),
            _parse_json_list(scholarship.get("eligible_cities")),
            _parse_json_list(scholarship.get("regions")),
        )

        extrac_match = _count_matches(
            _parse_json_list(profile.get("extracurriculars")),
            _parse_json_list(scholarship.get("preferred_extracurriculars")),
        )
        award_match = _count_matches(
            _parse_json_list(profile.get("awards")),
            _parse_json_list(scholarship.get("preferred_awards")),
        )

        readiness = compute_readiness(
            profile.get("documents"),
            scholarship.get("required_documents"),
        )

        eligible_regions = _parse_json_list(scholarship.get("eligible_regions"))
        legacy_regions = _parse_json_list(scholarship.get("regions"))
        eligible_cities = _parse_json_list(scholarship.get("eligible_cities"))

        return ScoringPayload(
            gwa_normalized=profile.get("gwa_normalized"),
            household_income_annual=income,
            income_bracket=income_bracket,
            field_match_level=field_match,
            geographic_match_level=geo_match,
            equity_flags=_get_equity_flags(profile),
            extracurricular_match_count=extrac_match,
            award_match_count=award_match,
            school_type_match=school_match,
            age_within_range=age_ok,
            scholarship_type=scholarship.get("scholarship_type") or "Merit-and-Need",
            min_gwa_required=scholarship.get("min_gwa_normalized"),
            max_income_threshold=scholarship.get("max_income_threshold"),
            priority_groups=_parse_json_list(scholarship.get("priority_groups")),
            document_readiness_ratio=readiness.ratio,
            profile_region=profile.get("region"),
            profile_city=profile.get("city_municipality"),
            eligible_regions=eligible_regions or legacy_regions,
            eligible_cities=eligible_cities,
        )

    def _build_match_result(self, scholarship: dict, scoring_result: ScoringResult) -> dict:
        """Build API response dict from scholarship and scoring result."""
        return {
            "id": scholarship.get("id"),
            "title": scholarship.get("title"),
            "provider": scholarship.get("provider"),
            "link": scholarship.get("link"),
            "description": scholarship.get("description"),
            "regions": _parse_json_list(scholarship.get("regions") or scholarship.get("eligible_regions")),
            "min_age": scholarship.get("min_age"),
            "max_age": scholarship.get("max_age"),
            "level": scholarship.get("level"),
            "score": scoring_result.final_score,
            "final_score": scoring_result.final_score,
            "eligibility_status": scoring_result.eligibility_status,
            "readiness_score": scoring_result.readiness_score,
            "explanation": scoring_result.explanation,
            "breakdown": scoring_result.breakdown,
            "confidence": scoring_result.confidence,
            "provider_type": scholarship.get("provider_type"),
            "scholarship_type": scholarship.get("scholarship_type"),
            "benefit_tuition": scholarship.get("benefit_tuition"),
            "benefit_allowance_monthly": scholarship.get("benefit_allowance_monthly"),
            "benefit_books": scholarship.get("benefit_books"),
            "benefit_total_value": scholarship.get("benefit_total_value"),
            "application_deadline": (
                scholarship.get("application_deadline").isoformat()
                if hasattr(scholarship.get("application_deadline"), "isoformat")
                else scholarship.get("application_deadline")
            ),
            "application_open_date": (
                scholarship.get("application_open_date").isoformat()
                if hasattr(scholarship.get("application_open_date"), "isoformat")
                else scholarship.get("application_open_date")
            ),
            "required_documents": _parse_json_list(scholarship.get("required_documents")),
        }
