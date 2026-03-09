"""
Scoring engine interface contract.
Defines WHAT the scoring engine receives and returns - NOT the scoring formula.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ScoringPayload:
    """
    Everything the scoring engine needs.
    Architecture defines WHAT, not HOW.
    """

    # Student signals
    gwa_normalized: float | None
    household_income_annual: int | None
    income_bracket: str | None
    field_match_level: str  # "exact", "broad", "partial", "none"
    geographic_match_level: str  # "city", "region", "island_group", "none"
    equity_flags: dict[str, bool]
    extracurricular_match_count: int
    award_match_count: int
    school_type_match: bool
    age_within_range: bool

    # Scholarship context
    scholarship_type: str
    min_gwa_required: float | None
    max_income_threshold: int | None
    priority_groups: list[str]

    # Document readiness
    document_readiness_ratio: float

    # Geographic context for explanation (optional, used in breakdown)
    profile_region: str | None = None
    profile_city: str | None = None
    eligible_regions: list | None = None
    eligible_cities: list | None = None


@dataclass
class ScoringResult:
    """
    What the scoring engine must return.
    Architecture defines FORMAT, not VALUES.
    """

    final_score: float
    eligibility_status: bool
    breakdown: dict
    explanation: list[str]
    readiness_score: float
    confidence: str  # "high" | "medium" | "low"


class ScoringEnginePort(ABC):
    """Interface that the scoring agent must implement."""

    @abstractmethod
    def score(self, payload: ScoringPayload) -> ScoringResult:
        """Score a single student-scholarship pair."""
        ...
