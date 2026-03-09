"""
Integration test: MatchService with WeightedDeterministicScorer.
Verifies the full match flow works end-to-end.
"""

from app.matching.match_service import MatchService
from app.scoring import WeightedDeterministicScorer


def test_match_service_returns_ranked_results():
    """MatchService uses WeightedDeterministicScorer and returns ranked matches."""
    service = MatchService()
    assert isinstance(service.scoring_engine, WeightedDeterministicScorer)

    profile = {
        "id": 1,
        "age": 20,
        "education_level": "College",
        "region": "NCR",
        "city_municipality": "Manila",
        "school_type": "Public",
        "household_income_annual": 200_000,
        "gwa_normalized": 85.0,
        "field_of_study_broad": "Engineering",
        "field_of_study_specific": "BS Civil Engineering",
        "is_pwd": False,
        "documents": [{"type": "TOR", "status": "uploaded"}],
    }

    scholarships = [
        {
            "id": 1,
            "title": "Test Scholarship",
            "provider": "Test",
            "eligible_levels": ["College"],
            "eligible_regions": ["NCR"],
            "eligible_courses_psced": ["Engineering"],
            "max_income_threshold": 250_000,
            "min_gwa_normalized": 75.0,
            "required_documents": ["TOR", "ITR"],
        },
    ]

    results = service.get_matches(profile, scholarships)
    assert len(results) == 1
    assert "final_score" in results[0]
    assert "breakdown" in results[0]
    assert "explanation" in results[0]
    assert 0 <= results[0]["final_score"] <= 100
