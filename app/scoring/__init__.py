"""
Weighted deterministic scoring engine for scholarship matching.
"""

from app.scoring.config import ScoringConfig
from app.scoring.engine import WeightedDeterministicScorer

__all__ = ["WeightedDeterministicScorer", "ScoringConfig"]
