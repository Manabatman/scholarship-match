def score_scholarship(profile: dict, scholarship: dict) -> int:
    score = scholarship["score"]

    gpa = profile.get("gpa")
    financial_need = profile.get("financial_need")

    # GPA rule
    if gpa is not None and gpa <= 2.0:
        score += 10

    # Financial need rule
    if financial_need is not None and financial_need >= 200000:
        score += 20

    return score
