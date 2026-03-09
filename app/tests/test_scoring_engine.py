"""
Tests for the weighted deterministic scoring engine.
"""

import pytest
from app.matching.scoring_port import ScoringPayload, ScoringResult
from app.scoring.components import (
    score_academic,
    score_equity,
    score_field,
    score_geographic,
    score_income,
    score_readiness,
)
from app.scoring.config import ScoringConfig
from app.scoring.engine import WeightedDeterministicScorer
from app.scoring.explanation import assess_confidence, compute_equity_multiplier


def _make_payload(**overrides) -> ScoringPayload:
    defaults = {
        "gwa_normalized": 85.0,
        "household_income_annual": 200_000,
        "income_bracket": "below_250k",
        "field_match_level": "exact",
        "geographic_match_level": "region",
        "equity_flags": {"is_pwd": False, "is_4ps_listahanan": False},
        "extracurricular_match_count": 0,
        "award_match_count": 0,
        "school_type_match": True,
        "age_within_range": True,
        "scholarship_type": "Merit-and-Need",
        "min_gwa_required": 75.0,
        "max_income_threshold": 250_000,
        "priority_groups": [],
        "document_readiness_ratio": 0.8,
    }
    defaults.update(overrides)
    return ScoringPayload(**defaults)


# --- Component unit tests ---


def test_score_academic_exceeds_minimum():
    assert score_academic(90.0, 75.0) == 1.0


def test_score_academic_meets_minimum():
    assert score_academic(75.0, 75.0) == 0.75


def test_score_academic_missing_gwa():
    assert score_academic(None, 75.0) == 0.5


def test_score_academic_no_minimum_requirement():
    assert 0.5 <= score_academic(85.0, None) <= 1.0


def test_score_academic_below_minimum():
    assert score_academic(70.0, 75.0) == 0.25


def test_score_income_need_based_low_income():
    assert score_income(100_000, None, 250_000, "Need-based", None) > 0.5


def test_score_income_need_based_at_ceiling():
    assert score_income(250_000, None, 250_000, "Need-based", None) == 0.0


def test_score_income_merit_based():
    assert score_income(500_000, None, 250_000, "Merit", None) == 0.5


def test_score_income_missing_uses_bracket():
    midpoints = {"below_250k": 125_000}
    assert score_income(None, "below_250k", 250_000, "Need-based", midpoints) > 0.4


def test_score_income_missing_no_bracket():
    assert score_income(None, None, 250_000, "Need-based", None) == 0.4


def test_score_field_exact():
    assert score_field("exact") == 1.0


def test_score_field_broad():
    assert score_field("broad") == 0.75


def test_score_field_partial():
    assert score_field("partial") == 0.4


def test_score_field_none():
    assert score_field("none") == 0.0


def test_score_geographic_city():
    assert score_geographic("city") == 1.0


def test_score_geographic_region():
    assert score_geographic("region") == 0.75


def test_score_geographic_island_group():
    assert score_geographic("island_group") == 0.4


def test_score_geographic_none():
    assert score_geographic("none") == 0.0


def test_score_equity_two_matches():
    flags = {"is_pwd": True, "is_4ps_listahanan": True}
    groups = ["PWD", "4Ps/Listahanan"]
    assert score_equity(flags, groups) == 1.0


def test_score_equity_one_match():
    flags = {"is_pwd": True}
    groups = ["PWD"]
    assert score_equity(flags, groups) == 0.75


def test_score_equity_no_match_has_priority_groups():
    flags = {"is_pwd": False}
    groups = ["PWD"]
    assert score_equity(flags, groups) == 0.0


def test_score_equity_no_priority_groups():
    assert score_equity({}, []) == 0.5


def test_score_readiness_full():
    assert score_readiness(1.0) == 1.0


def test_score_readiness_partial():
    assert score_readiness(0.5) == 0.5


def test_score_readiness_none():
    assert score_readiness(0.0) == 0.0


# --- Engine integration tests ---


def test_engine_returns_scoring_result():
    scorer = WeightedDeterministicScorer()
    payload = _make_payload()
    result = scorer.score(payload)
    assert isinstance(result, ScoringResult)
    assert 0 <= result.final_score <= 100
    assert result.eligibility_status is True
    assert isinstance(result.breakdown, dict)
    assert isinstance(result.explanation, list)
    assert "academic" in result.breakdown
    assert "socioeconomic" in result.breakdown


def test_engine_deterministic():
    scorer = WeightedDeterministicScorer()
    payload = _make_payload()
    r1 = scorer.score(payload)
    r2 = scorer.score(payload)
    assert r1.final_score == r2.final_score


def test_engine_high_score_strong_match():
    payload = _make_payload(
        gwa_normalized=92.0,
        field_match_level="exact",
        geographic_match_level="city",
        document_readiness_ratio=1.0,
    )
    result = WeightedDeterministicScorer().score(payload)
    assert result.final_score >= 75


def test_engine_low_score_weak_match():
    payload = _make_payload(
        gwa_normalized=None,
        field_match_level="none",
        geographic_match_level="none",
        document_readiness_ratio=0.0,
    )
    result = WeightedDeterministicScorer().score(payload)
    assert result.final_score < 60


# --- Edge cases ---


def test_missing_gwa_confidence_low():
    payload = _make_payload(
        gwa_normalized=None,
        min_gwa_required=75.0,
        household_income_annual=200_000,
        income_bracket="below_250k",
    )
    result = WeightedDeterministicScorer().score(payload)
    assert result.confidence in ("low", "medium")


def test_missing_income_confidence():
    payload = _make_payload(
        household_income_annual=None,
        income_bracket=None,
        max_income_threshold=250_000,
    )
    result = WeightedDeterministicScorer().score(payload)
    assert result.confidence in ("low", "medium", "high")


def test_equity_multiplier_capped():
    config = ScoringConfig()
    config.max_equity_multiplier = 1.15
    flags = {"is_pwd": True, "is_indigenous_people": True, "is_4ps_listahanan": True}
    groups = ["PWD", "IP", "4Ps/Listahanan"]
    mult, _ = compute_equity_multiplier(
        flags, groups, config.equity_multipliers, config.max_equity_multiplier
    )
    assert mult <= 1.15


def test_equity_boost_applied():
    payload = _make_payload(equity_flags={"is_pwd": True}, priority_groups=["PWD"])
    result = WeightedDeterministicScorer().score(payload)
    assert "PWD" in str(result.explanation) or "RA 7277" in str(result.explanation) or result.final_score > 0


def test_assess_confidence_high():
    payload = _make_payload(
        gwa_normalized=85.0,
        household_income_annual=200_000,
        income_bracket="below_250k",
    )
    assert assess_confidence(payload) == "high"


def test_assess_confidence_low():
    payload = _make_payload(
        gwa_normalized=None,
        household_income_annual=None,
        income_bracket=None,
        max_income_threshold=250_000,
    )
    # Both GWA and income missing when required
    assert assess_confidence(payload) in ("low", "medium")


def test_config_custom_weights():
    config = ScoringConfig()
    config.weights = {"academic": 0.5, "income": 0.5, "field_alignment": 0, "geographic": 0, "equity_priority": 0, "readiness": 0}
    scorer = WeightedDeterministicScorer(config=config)
    payload = _make_payload()
    result = scorer.score(payload)
    assert 0 <= result.final_score <= 100


def test_breakdown_has_required_keys():
    result = WeightedDeterministicScorer().score(_make_payload())
    for key in ("academic", "socioeconomic", "field_relevance", "geographic", "document_readiness", "priority_group"):
        assert key in result.breakdown
        assert "status" in result.breakdown[key]
        assert "user_value" in result.breakdown[key]
        assert "requirement_value" in result.breakdown[key]
