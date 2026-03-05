"""
Legacy rule-based scorer - adapter wrapping original rules.py logic.
Implements ScoringEnginePort. Preserves backward compatibility.
"""

from app.matching.scoring_port import ScoringEnginePort, ScoringPayload, ScoringResult


class LegacyRuleScorer(ScoringEnginePort):
    """
    Adapter that implements ScoringEnginePort using the original rule-based logic.
    Maps ScoringPayload signals to score adjustments (structure only - no weight tuning).
    """

    def score(self, payload: ScoringPayload) -> ScoringResult:
        score = 50.0  # Base score (from original rules)

        # Age
        if payload.age_within_range:
            score += 20
        else:
            score -= 30

        # Geographic
        if payload.geographic_match_level and payload.geographic_match_level != "none":
            score += 25
        elif payload.geographic_match_level == "none":
            score -= 10

        # Field / level (combined from original level + needs)
        if payload.field_match_level == "exact":
            score += 25
        elif payload.field_match_level == "broad":
            score += 15
        elif payload.field_match_level == "partial":
            score += 5
        else:
            score -= 20

        # Extracurriculars and awards (bonus)
        score += payload.extracurricular_match_count * 5
        score += payload.award_match_count * 5

        # School type
        if payload.school_type_match:
            score += 5

        # Equity / priority group match
        for group in payload.priority_groups:
            flag_key = group.lower().replace(" ", "_").replace("/", "_")
            if payload.equity_flags.get(flag_key) or payload.equity_flags.get(group):
                score += 10
                break

        # GWA vs min (bonus for exceeding)
        if payload.gwa_normalized is not None and payload.min_gwa_required is not None:
            if payload.gwa_normalized >= payload.min_gwa_required:
                diff = payload.gwa_normalized - payload.min_gwa_required
                score += min(10, diff / 2)  # Cap bonus

        # Income (bonus for being well under ceiling)
        if (
            payload.household_income_annual is not None
            and payload.max_income_threshold is not None
            and payload.household_income_annual < payload.max_income_threshold
        ):
            score += 5

        score = max(0.0, min(100.0, score))

        # Readiness from document ratio
        readiness = payload.document_readiness_ratio * 100.0

        # Build breakdown (structure only)
        breakdown = {
            "academic": {
                "status": "exceeded" if payload.field_match_level in ("exact", "broad") else "met" if payload.field_match_level == "partial" else "missing",
                "user_value": f"GWA: {payload.gwa_normalized:.1f}%" if payload.gwa_normalized else "Not provided",
                "requirement_value": f"Min: {payload.min_gwa_required}%" if payload.min_gwa_required else "N/A",
            },
            "socioeconomic": {
                "status": "met" if payload.max_income_threshold is None or (payload.household_income_annual or 0) <= (payload.max_income_threshold or 0) else "missing",
                "user_value": f"Income: PHP {payload.household_income_annual:,}" if payload.household_income_annual else "Not provided",
                "requirement_value": f"Max: PHP {payload.max_income_threshold:,}" if payload.max_income_threshold else "N/A",
            },
            "field_relevance": {
                "status": payload.field_match_level if payload.field_match_level != "none" else "missing",
                "user_value": payload.field_match_level,
                "requirement_value": "Course match",
            },
            "geographic": {
                "status": "met" if payload.geographic_match_level != "none" else "missing",
                "user_value": payload.geographic_match_level,
                "requirement_value": "Region/City",
            },
            "document_readiness": {
                "status": "ready" if payload.document_readiness_ratio >= 1.0 else "partial" if payload.document_readiness_ratio > 0 else "missing",
                "user_value": f"{int(payload.document_readiness_ratio * 100)}% ready",
                "requirement_value": "Documents",
            },
        }

        explanation = []
        if payload.age_within_range:
            explanation.append("Age within eligible range")
        if payload.geographic_match_level != "none":
            explanation.append(f"Geographic match: {payload.geographic_match_level}")
        if payload.field_match_level in ("exact", "broad"):
            explanation.append("Course/field alignment")
        if payload.document_readiness_ratio < 1.0 and payload.document_readiness_ratio > 0:
            explanation.append("Some documents still needed")

        confidence = "high" if score >= 80 else "medium" if score >= 60 else "low"

        return ScoringResult(
            final_score=round(score, 2),
            eligibility_status=score > 0,
            breakdown=breakdown,
            explanation=explanation,
            readiness_score=round(readiness, 2),
            confidence=confidence,
        )
