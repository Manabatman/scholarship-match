"""
Deterministic match explanation generator.
Produces breakdown and plain-language explanation for every score.
"""

from app.matching.scoring_port import ScoringPayload
from app.taxonomy.equity_groups import EQUITY_GROUPS


def _get_equity_match_reason(equity_flags: dict[str, bool], priority_groups: list[str]) -> str | None:
    """Return the first matching equity group's RA reference for explanation."""
    for group in priority_groups or []:
        if not group:
            continue
        flag_key = group.lower().replace(" ", "_").replace("/", "_")
        if equity_flags.get(flag_key) or equity_flags.get(group):
            info = EQUITY_GROUPS.get(group, {})
            ra = info.get("ra_reference", group)
            return f"{group} ({ra})"
    return None


def _compute_equity_multiplier(
    equity_flags: dict[str, bool],
    priority_groups: list[str],
    equity_multipliers: dict[str, float],
    max_cap: float,
) -> tuple[float, str | None]:
    """
    Compute equity multiplier and reason.
    Returns (multiplier, reason_string).
    Uses EQUITY_GROUPS profile_flag to map priority group to config key.
    """
    multiplier = 1.0
    reason = None
    for group in priority_groups or []:
        if not group:
            continue
        flag_key = group.lower().replace(" ", "_").replace("/", "_")
        profile_flag = EQUITY_GROUPS.get(group, {}).get("profile_flag") or f"is_{flag_key}"
        if equity_flags.get(flag_key) or equity_flags.get(profile_flag) or equity_flags.get(group):
            mult = equity_multipliers.get(profile_flag) or equity_multipliers.get(flag_key)
            if mult and multiplier * mult <= max_cap:
                multiplier *= mult
                if not reason:
                    info = EQUITY_GROUPS.get(group, {})
                    reason = info.get("ra_reference", group)
    return (min(multiplier, max_cap), reason)


def build_breakdown(
    components: dict[str, float],
    payload: ScoringPayload,
    weights: dict[str, float],
) -> dict:
    """
    Build structured breakdown compatible with MatchBreakdownSchema.
    Each component includes status, user_value, requirement_value for legacy compatibility.
    """
    def _academic_detail() -> tuple[str, str, str]:
        gwa = payload.gwa_normalized
        min_gwa = payload.min_gwa_required
        if gwa is None:
            return ("partial", "Not provided", "N/A" if min_gwa is None else f"Min: {min_gwa:.0f}%")
        if min_gwa is None:
            return ("met", f"GWA: {gwa:.1f}%", "No minimum")
        if gwa >= min_gwa + 10:
            return ("exceeded", f"GWA: {gwa:.1f}%", f"Min: {min_gwa:.0f}% (exceeds by {gwa - min_gwa:.0f})")
        if gwa >= min_gwa:
            return ("met", f"GWA: {gwa:.1f}%", f"Min: {min_gwa:.0f}%")
        return ("missing", f"GWA: {gwa:.1f}%", f"Min: {min_gwa:.0f}%")

    def _socioeconomic_detail() -> tuple[str, str, str]:
        income = payload.household_income_annual
        threshold = payload.max_income_threshold
        if threshold is None:
            return ("met", "N/A", "No income limit")
        if income is not None:
            status = "met" if income <= threshold else "missing"
            return (status, f"PHP {income:,}", f"Max: PHP {threshold:,}")
        return ("partial", "Not provided", f"Max: PHP {threshold:,}")

    def _field_detail() -> tuple[str, str, str]:
        level = payload.field_match_level or "none"
        if level == "none":
            return ("missing", level, "Course match")
        return (level, level, "Course match")

    def _geographic_detail() -> tuple[str, str, str]:
        level = payload.geographic_match_level or "none"
        if level == "none":
            return ("missing", level, "Region/City")
        return ("met", level, "Region/City")

    def _readiness_detail() -> tuple[str, str, str]:
        ratio = payload.document_readiness_ratio
        pct = int(ratio * 100) if ratio is not None else 0
        if ratio is None or ratio >= 1.0:
            return ("ready", f"{pct}% ready", "Documents")
        if ratio > 0:
            return ("partial", f"{pct}% ready", "Documents")
        return ("missing", "0% ready", "Documents")

    def _equity_detail() -> tuple[str, str, str]:
        match_count = 0
        for group in payload.priority_groups or []:
            flag_key = group.lower().replace(" ", "_").replace("/", "_")
            if payload.equity_flags.get(flag_key) or payload.equity_flags.get(group):
                match_count += 1
        if not payload.priority_groups:
            return ("met", "N/A", "No priority groups")
        if match_count > 0:
            return ("matched", f"{match_count} group(s) matched", "Priority groups")
        return ("missing", "No match", "Priority groups")

    ac_status, ac_user, ac_req = _academic_detail()
    soc_status, soc_user, soc_req = _socioeconomic_detail()
    field_status, field_user, field_req = _field_detail()
    geo_status, geo_user, geo_req = _geographic_detail()
    read_status, read_user, read_req = _readiness_detail()
    eq_status, eq_user, eq_req = _equity_detail()

    return {
        "academic": {
            "status": ac_status,
            "user_value": ac_user,
            "requirement_value": ac_req,
            "score": components.get("academic", 0),
            "weighted": round((components.get("academic", 0) * weights.get("academic", 0.3)) * 100, 1),
            "max_possible": round(weights.get("academic", 0.3) * 100, 1),
        },
        "socioeconomic": {
            "status": soc_status,
            "user_value": soc_user,
            "requirement_value": soc_req,
            "score": components.get("income", 0),
            "weighted": round((components.get("income", 0) * weights.get("income", 0.25)) * 100, 1),
            "max_possible": round(weights.get("income", 0.25) * 100, 1),
        },
        "field_relevance": {
            "status": field_status,
            "user_value": field_user,
            "requirement_value": field_req,
            "score": components.get("field_alignment", 0),
            "weighted": round((components.get("field_alignment", 0) * weights.get("field_alignment", 0.2)) * 100, 1),
            "max_possible": round(weights.get("field_alignment", 0.2) * 100, 1),
        },
        "geographic": {
            "status": geo_status,
            "user_value": geo_user,
            "requirement_value": geo_req,
            "score": components.get("geographic", 0),
            "weighted": round((components.get("geographic", 0) * weights.get("geographic", 0.1)) * 100, 1),
            "max_possible": round(weights.get("geographic", 0.1) * 100, 1),
        },
        "document_readiness": {
            "status": read_status,
            "user_value": read_user,
            "requirement_value": read_req,
            "score": components.get("readiness", 0),
            "weighted": round((components.get("readiness", 0) * weights.get("readiness", 0.05)) * 100, 1),
            "max_possible": round(weights.get("readiness", 0.05) * 100, 1),
        },
        "priority_group": {
            "status": eq_status,
            "user_value": eq_user,
            "requirement_value": eq_req,
            "score": components.get("equity_priority", 0),
            "weighted": round((components.get("equity_priority", 0) * weights.get("equity_priority", 0.1)) * 100, 1),
            "max_possible": round(weights.get("equity_priority", 0.1) * 100, 1),
        },
    }


def build_explanation(
    components: dict[str, float],
    payload: ScoringPayload,
    equity_multiplier: float,
    equity_reason: str | None,
) -> list[str]:
    """Build plain-language explanation strings for the student."""
    lines: list[str] = []
    if payload.gwa_normalized is not None and payload.min_gwa_required is not None:
        if payload.gwa_normalized >= payload.min_gwa_required + 10:
            lines.append(f"GWA {payload.gwa_normalized:.0f}% exceeds minimum {payload.min_gwa_required:.0f}%")
        elif payload.gwa_normalized >= payload.min_gwa_required:
            lines.append(f"GWA {payload.gwa_normalized:.0f}% meets minimum requirement")
    elif payload.gwa_normalized is None:
        lines.append("GWA not provided — score may change when added")
    if payload.household_income_annual is not None and payload.max_income_threshold is not None:
        if payload.household_income_annual <= payload.max_income_threshold:
            lines.append(f"Income PHP {payload.household_income_annual:,} within ceiling PHP {payload.max_income_threshold:,}")
    if payload.field_match_level in ("exact", "broad"):
        lines.append("Course/field alignment")
    elif payload.field_match_level == "partial":
        lines.append("Partial course alignment")
    if payload.geographic_match_level == "city":
        lines.append("Exact LGU/city match")
    elif payload.geographic_match_level == "region":
        lines.append("Region match")
    elif payload.geographic_match_level == "island_group":
        lines.append("Island group match")
    if equity_reason and equity_multiplier > 1.0:
        lines.append(f"Equity priority: {equity_reason}")
    if payload.document_readiness_ratio is not None and 0 < payload.document_readiness_ratio < 1.0:
        pct = int(payload.document_readiness_ratio * 100)
        lines.append(f"Document readiness: {pct}% — some documents still needed")
    return lines


def assess_confidence(payload: ScoringPayload) -> str:
    """
    Assess confidence based on data completeness.
    Missing GWA or income -> lower confidence.
    """
    missing = 0
    if payload.gwa_normalized is None and payload.min_gwa_required is not None:
        missing += 1
    if payload.household_income_annual is None and payload.income_bracket is None and payload.max_income_threshold is not None:
        missing += 1
    if payload.field_match_level == "none" and payload.min_gwa_required is not None:
        missing += 0.5  # Partial penalty
    if missing >= 2:
        return "low"
    if missing >= 1:
        return "medium"
    return "high"


def compute_equity_multiplier(
    equity_flags: dict[str, bool],
    priority_groups: list[str],
    equity_multipliers: dict[str, float],
    max_cap: float,
) -> tuple[float, str | None]:
    """
    Compute equity multiplier from matching priority groups.
    Returns (multiplier, reason_string).
    """
    return _compute_equity_multiplier(
        equity_flags, priority_groups, equity_multipliers, max_cap
    )
