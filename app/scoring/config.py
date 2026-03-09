"""
Scoring engine configuration.
Weights and equity multipliers are adjustable without rewriting scoring logic.
"""

from dataclasses import dataclass, field


def _default_weights() -> dict[str, float]:
    return {
        "academic": 0.30,
        "income": 0.25,
        "field_alignment": 0.20,
        "geographic": 0.10,
        "equity_priority": 0.10,
        "readiness": 0.05,
    }


def _default_equity_multipliers() -> dict[str, float]:
    return {
        "is_pwd": 1.08,
        "is_indigenous_people": 1.10,
        "is_solo_parent_dependent": 1.05,
        "is_4ps_listahanan": 1.07,
        "is_underprivileged": 1.06,
        "is_ofw_dependent": 1.03,
        "is_farmer_fisher_dependent": 1.04,
    }


def _default_income_bracket_midpoints() -> dict[str, int]:
    return {
        "below_250k": 125_000,
        "250k_400k": 325_000,
        "400k_500k": 450_000,
        "above_500k": 600_000,
    }


@dataclass
class ScoringConfig:
    """
    Configuration for the weighted deterministic scoring engine.
    Weights must sum to 1.0. Equity multipliers are applied multiplicatively
    and capped by max_equity_multiplier.
    """

    weights: dict[str, float] = field(default_factory=_default_weights)
    equity_multipliers: dict[str, float] = field(default_factory=_default_equity_multipliers)
    max_equity_multiplier: float = 1.15
    income_bracket_midpoints: dict[str, int] = field(default_factory=_default_income_bracket_midpoints)
