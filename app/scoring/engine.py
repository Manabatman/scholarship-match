"""
Weighted deterministic scoring engine.
Implements ScoringEnginePort with configurable weights and equity multipliers.
"""

from app.matching.scoring_port import ScoringEnginePort, ScoringPayload, ScoringResult
from app.scoring.components import (
    score_academic,
    score_equity,
    score_field,
    score_geographic,
    score_income,
    score_readiness,
)
from app.scoring.config import ScoringConfig
from app.scoring.explanation import (
    assess_confidence,
    build_breakdown,
    build_explanation,
    compute_equity_multiplier,
)


class WeightedDeterministicScorer(ScoringEnginePort):
    """
    Deterministic weighted scoring engine.
    Same input -> same output. Every component is explainable.
    """

    def __init__(self, config: ScoringConfig | None = None):
        self.config = config or ScoringConfig()

    def score(self, payload: ScoringPayload) -> ScoringResult:
        # 1. Compute each component (0.0 - 1.0)
        components = {
            "academic": score_academic(
                payload.gwa_normalized,
                payload.min_gwa_required,
            ),
            "income": score_income(
                payload.household_income_annual,
                payload.income_bracket,
                payload.max_income_threshold,
                payload.scholarship_type or "",
                self.config.income_bracket_midpoints,
            ),
            "field_alignment": score_field(payload.field_match_level),
            "geographic": score_geographic(payload.geographic_match_level),
            "equity_priority": score_equity(
                payload.equity_flags,
                payload.priority_groups,
            ),
            "readiness": score_readiness(payload.document_readiness_ratio),
        }

        # 2. Weighted sum -> base score (0-100)
        base_score = sum(
            components[key] * self.config.weights.get(key, 0)
            for key in components
        ) * 100

        # 3. Apply equity multipliers
        equity_multiplier, equity_reason = compute_equity_multiplier(
            payload.equity_flags,
            payload.priority_groups,
            self.config.equity_multipliers,
            self.config.max_equity_multiplier,
        )
        adjusted_score = base_score * equity_multiplier

        # 4. Clamp to 0-100
        final_score = max(0.0, min(100.0, adjusted_score))

        # 5. Generate explanation
        breakdown = build_breakdown(
            components,
            payload,
            self.config.weights,
        )
        explanation = build_explanation(
            components,
            payload,
            equity_multiplier,
            equity_reason,
        )

        # 6. Confidence based on data completeness
        confidence = assess_confidence(payload)

        return ScoringResult(
            final_score=round(final_score, 2),
            eligibility_status=True,
            breakdown=breakdown,
            explanation=explanation,
            readiness_score=round(
                (payload.document_readiness_ratio or 0) * 100, 2
            ),
            confidence=confidence,
        )
