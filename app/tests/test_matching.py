from app.matching.rules import score_scholarship

def test_disqualification():
    student = {"region": "NCR", "age": 20, "school": "Ateneo", "needs_tags": ["financial"]}
    scholarship = {"school_specific": "UP Diliman", "eligible_regions": ["NCR"], "eligible_countries": ["PH"], "needs_tags": ["financial"]}
    score, explanation = score_scholarship(student, scholarship)
    assert score == 0
    assert "disqualified" in explanation[0].lower()

def test_full_match():
    student = {"region": "NCR", "age": 20, "school": "UP Diliman", "needs_tags": ["financial", "merit"]}
    scholarship = {"school_specific": "UP Diliman", "eligible_regions": ["NCR"], "eligible_countries": ["PH"], "needs_tags": ["financial", "merit"]}
    score, explanation = score_scholarship(student, scholarship)
    assert score > 0
    assert "Region matched" in explanation