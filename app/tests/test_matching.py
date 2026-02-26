from app.matching.rules import score_scholarship


def test_base_score():
    """Base score is 50 when no criteria apply."""
    profile = {"age": 25, "region": None, "needs": []}
    scholarship = {"score": 50, "regions": [], "min_age": None, "max_age": None, "needs_tags": []}
    score = score_scholarship(profile, scholarship)
    assert score == 50


def test_age_too_young():
    """Score drops when profile age is below min_age."""
    profile = {"age": 15, "region": None, "needs": []}
    scholarship = {
        "score": 50,
        "regions": [],
        "min_age": 18,
        "max_age": 25,
        "needs_tags": [],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 20  # 50 - 30 (age)


def test_age_too_old():
    """Score drops when profile age is above max_age."""
    profile = {"age": 30, "region": None, "needs": []}
    scholarship = {
        "score": 50,
        "regions": [],
        "min_age": 18,
        "max_age": 25,
        "needs_tags": [],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 20  # 50 - 30 (age)


def test_age_perfect_match():
    """Score boosts when age falls within scholarship range."""
    profile = {"age": 20, "region": "NCR", "needs": []}
    scholarship = {
        "score": 50,
        "regions": ["NCR"],
        "min_age": 18,
        "max_age": 25,
        "needs_tags": [],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 95  # 50 + 20 (age) + 25 (region)


def test_region_match():
    """Score boosts when profile region overlaps scholarship regions."""
    profile = {"age": 20, "region": "NCR", "needs": []}
    scholarship = {
        "score": 50,
        "regions": ["NCR"],
        "min_age": None,
        "max_age": None,
        "needs_tags": [],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 75  # 50 + 25


def test_region_mismatch():
    """Score drops when region does not match."""
    profile = {"age": 20, "region": "Visayas", "needs": []}
    scholarship = {
        "score": 50,
        "regions": ["NCR"],
        "min_age": None,
        "max_age": None,
        "needs_tags": [],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 40  # 50 - 10


def test_needs_match():
    """Score boosts when needs tags overlap."""
    profile = {"age": 20, "region": "NCR", "needs": ["financial", "merit"]}
    scholarship = {
        "score": 50,
        "regions": ["NCR"],
        "min_age": None,
        "max_age": None,
        "needs_tags": ["financial", "merit"],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 95  # 50 + 25 (region) + 20 (2 needs)


def test_needs_no_match():
    """Score drops when needs tags don't overlap."""
    profile = {"age": 20, "region": "NCR", "needs": ["housing"]}
    scholarship = {
        "score": 50,
        "regions": ["NCR"],
        "min_age": None,
        "max_age": None,
        "needs_tags": ["financial"],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 70  # 50 + 25 (region) - 5 (needs no overlap)


def test_score_clamped_to_100():
    """Score never exceeds 100."""
    profile = {"age": 20, "region": "NCR", "needs": ["financial", "merit", "housing"]}
    scholarship = {
        "score": 50,
        "regions": ["NCR"],
        "min_age": 18,
        "max_age": 25,
        "needs_tags": ["financial", "merit", "housing"],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 100


def test_score_clamped_to_0():
    """Score never goes below 0."""
    profile = {"age": 10, "region": "Visayas", "needs": ["housing"]}
    scholarship = {
        "score": 0,  # Low base to allow clamping to 0
        "regions": ["NCR"],
        "min_age": 18,
        "max_age": 25,
        "needs_tags": ["financial"],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 0  # 0 - 30 - 10 - 5 = -45, clamped to 0


def test_region_alias_ncr_metro_manila():
    """NCR matches Metro Manila via region alias."""
    profile = {"age": 20, "region": "NCR", "needs": []}
    scholarship = {
        "score": 50,
        "regions": ["Metro Manila"],
        "min_age": None,
        "max_age": None,
        "needs_tags": [],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 75  # 50 + 25 (region match via alias)


def test_needs_substring_financial():
    """Profile need 'financial' matches scholarship tag 'Financial Aid'."""
    profile = {"age": 20, "region": "NCR", "needs": ["financial"]}
    scholarship = {
        "score": 50,
        "regions": ["Metro Manila"],
        "min_age": None,
        "max_age": None,
        "needs_tags": ["Financial Aid"],
    }
    score = score_scholarship(profile, scholarship)
    assert score == 85  # 50 + 25 (region) + 10 (needs substring match)


def test_education_level_match():
    """Score boosts when education level matches."""
    profile = {
        "age": 20,
        "region": "NCR",
        "needs": [],
        "education_level": "College",
    }
    scholarship = {
        "score": 50,
        "regions": ["Metro Manila"],
        "min_age": None,
        "max_age": None,
        "needs_tags": [],
        "level": "College",
    }
    score = score_scholarship(profile, scholarship)
    assert score == 90  # 50 + 25 (region) + 15 (level)


def test_education_level_mismatch():
    """Score drops when education level mismatches."""
    profile = {
        "age": 20,
        "region": "NCR",
        "needs": [],
        "education_level": "Graduate",
    }
    scholarship = {
        "score": 50,
        "regions": ["Metro Manila"],
        "min_age": None,
        "max_age": None,
        "needs_tags": [],
        "level": "College",
    }
    score = score_scholarship(profile, scholarship)
    assert score == 55  # 50 + 25 (region) - 20 (level mismatch)
