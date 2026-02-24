def score_scholarship(profile: dict, scholarship: dict) -> float:
    score = scholarship.get("score", 50)  # Base score

    # Age matching
    profile_age = profile.get("age")
    min_age = scholarship.get("min_age")
    max_age = scholarship.get("max_age")
    
    if profile_age and min_age and profile_age < min_age:
        score -= 30  # Too young
    elif profile_age and max_age and profile_age > max_age:
        score -= 30  # Too old
    elif profile_age and min_age and max_age and min_age <= profile_age <= max_age:
        score += 20  # Perfect age match

    # Region matching
    profile_region = profile.get("region")
    scholarship_regions = scholarship.get("regions", [])
    
    if profile_region and scholarship_regions:
        if any(profile_region.lower() in region.lower() or region.lower() in profile_region.lower() 
               for region in scholarship_regions if region):
            score += 25  # Region match
        else:
            score -= 10  # Region mismatch

    # Needs matching
    profile_needs = profile.get("needs", [])
    scholarship_needs = scholarship.get("needs_tags", [])
    
    if profile_needs and scholarship_needs:
        matching_needs = set(n.lower() for n in profile_needs) & set(n.lower() for n in scholarship_needs)
        if matching_needs:
            score += len(matching_needs) * 10  # +10 per matching need
        else:
            score -= 5  # No matching needs

    # Ensure score is between 0 and 100
    score = max(0, min(100, score))
    
    return round(score, 2)
