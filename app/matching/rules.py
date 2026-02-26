# Region aliases: map common user inputs to canonical names for matching
REGION_ALIASES = {
    "ncr": "metro manila",
    "national capital region": "metro manila",
    "metro manila": "metro manila",
    "calabarzon": "luzon",
    "central luzon": "luzon",
    "ilocos": "luzon",
    "bicol": "luzon",
    "car": "luzon",
    "mimaropa": "luzon",
    "cagayan valley": "luzon",
    "luzon": "luzon",
    "western visayas": "visayas",
    "central visayas": "visayas",
    "eastern visayas": "visayas",
    "visayas": "visayas",
    "zamboanga": "mindanao",
    "northern mindanao": "mindanao",
    "davao region": "mindanao",
    "davao": "mindanao",
    "soccsksargen": "mindanao",
    "caraga": "mindanao",
    "barmm": "mindanao",
    "mindanao": "mindanao",
}


def _normalize_region(region: str) -> str:
    """Normalize region for matching (e.g. NCR -> metro manila)."""
    if not region or not region.strip():
        return ""
    key = region.strip().lower()
    return REGION_ALIASES.get(key, key)


def _needs_match(profile_need: str, scholarship_tag: str) -> bool:
    """Check if a profile need matches a scholarship tag (substring or exact)."""
    p = profile_need.lower().strip()
    s = scholarship_tag.lower().strip()
    if not p or not s:
        return False
    return p in s or s in p or p == s


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

    # Region matching (with alias normalization)
    profile_region = profile.get("region")
    scholarship_regions = scholarship.get("regions", [])

    if profile_region and scholarship_regions:
        normalized_profile = _normalize_region(profile_region)
        matched = False
        for region in scholarship_regions:
            if not region:
                continue
            normalized_scholarship = _normalize_region(region)
            if (
                normalized_profile in normalized_scholarship
                or normalized_scholarship in normalized_profile
                or normalized_profile == normalized_scholarship
            ):
                matched = True
                break
            # Also check raw region strings (for "NCR" in seed data)
            if (
                profile_region.lower() in region.lower()
                or region.lower() in profile_region.lower()
            ):
                matched = True
                break
        if matched:
            score += 25  # Region match
        else:
            score -= 10  # Region mismatch

    # Education level matching
    profile_level = (profile.get("education_level") or "").strip().lower()
    scholarship_level = (scholarship.get("level") or "").strip().lower()

    if profile_level and scholarship_level:
        if profile_level == scholarship_level:
            score += 15  # Level match
        else:
            score -= 20  # Level mismatch

    # Needs matching (substring/contains instead of exact match)
    profile_needs = profile.get("needs", [])
    scholarship_needs = scholarship.get("needs_tags", [])

    if profile_needs and scholarship_needs:
        matching_count = 0
        for p_need in profile_needs:
            for s_tag in scholarship_needs:
                if _needs_match(str(p_need), str(s_tag)):
                    matching_count += 1
                    break  # Count each profile need at most once
        if matching_count:
            score += matching_count * 10  # +10 per matching need
        else:
            score -= 5  # No matching needs

    # Ensure score is between 0 and 100
    score = max(0, min(100, score))

    return round(score, 2)
