"""
Scoring component functions.
Each returns a 0.0-1.0 score. Pure functions with no side effects.
"""


def score_academic(gwa_normalized: float | None, min_gwa_required: float | None) -> float:
    """
    Academic strength: how well student GWA meets/exceeds scholarship minimum.
    - No GWA data -> 0.5 (neutral)
    - Meets minimum exactly -> 0.75
    - Exceeds by 10+ points -> 1.0
    - Below minimum (defensive) -> 0.25
    """
    if gwa_normalized is None:
        return 0.5
    if min_gwa_required is None:
        # No minimum requirement -> neutral with slight boost for high GWA
        return min(1.0, 0.5 + (gwa_normalized / 200))  # 100% GWA -> 1.0
    if gwa_normalized < min_gwa_required:
        return 0.25
    diff = gwa_normalized - min_gwa_required
    if diff >= 10.0:
        return 1.0
    # Linear interpolation: 0 diff -> 0.75, 10 diff -> 1.0
    return 0.75 + (diff / 10.0) * 0.25


def score_income(
    household_income: int | None,
    income_bracket: str | None,
    max_income_threshold: int | None,
    scholarship_type: str,
    bracket_midpoints: dict[str, int] | None = None,
) -> float:
    """
    Income alignment: need-based scholarships favor lower income.
    - Merit-based: income not relevant -> 0.5 (neutral)
    - No income data -> 0.4 (slight penalty)
    - Need-based: lower income -> higher score (inverted distance from ceiling)
    """
    merit_types = ("merit", "merit-based", "academic")
    if scholarship_type and scholarship_type.lower().strip() in merit_types:
        return 0.5
    if max_income_threshold is None or max_income_threshold <= 0:
        return 0.5
    income = household_income
    if income is None and income_bracket and bracket_midpoints:
        income = bracket_midpoints.get(income_bracket)
    if income is None:
        return 0.4
    ratio = income / max_income_threshold
    return max(0.0, min(1.0, 1.0 - ratio))


def score_field(field_match_level: str) -> float:
    """
    Field alignment: PSCED-aligned course/discipline match quality.
    - exact -> 1.0
    - broad -> 0.75
    - partial -> 0.4
    - none -> 0.0
    """
    level = (field_match_level or "").strip().lower()
    mapping = {
        "exact": 1.0,
        "broad": 0.75,
        "partial": 0.4,
        "none": 0.0,
    }
    return mapping.get(level, 0.0)


def score_geographic(geographic_match_level: str) -> float:
    """
    Geographic relevance: location proximity for LGU and regional scholarships.
    - city -> 1.0
    - region -> 0.75
    - island_group -> 0.4
    - none -> 0.0
    """
    level = (geographic_match_level or "").strip().lower()
    mapping = {
        "city": 1.0,
        "region": 0.75,
        "island_group": 0.4,
        "none": 0.0,
    }
    return mapping.get(level, 0.0)


def score_equity(equity_flags: dict[str, bool], priority_groups: list[str]) -> float:
    """
    Equity priority: alignment between student equity flags and scholarship priority groups.
    - 2+ matches -> 1.0
    - 1 match -> 0.75
    - 0 matches, no priority groups -> 0.5 (neutral)
    - 0 matches, scholarship has priority groups -> 0.0
    """
    if not priority_groups:
        return 0.5
    match_count = 0
    for group in priority_groups:
        if not group:
            continue
        flag_key = group.lower().replace(" ", "_").replace("/", "_")
        is_flag = f"is_{flag_key}"
        if equity_flags.get(flag_key) or equity_flags.get(is_flag) or equity_flags.get(group):
            match_count += 1
    if match_count >= 2:
        return 1.0
    if match_count == 1:
        return 0.75
    return 0.0


def score_readiness(document_readiness_ratio: float) -> float:
    """
    Document readiness: direct pass-through of ratio (0.0 to 1.0).
    Already computed by app/documents/readiness.py.
    """
    if document_readiness_ratio is None:
        return 0.0
    return max(0.0, min(1.0, float(document_readiness_ratio)))
