"""
Philippine income threshold brackets for scholarship eligibility.
Aligned with SM Foundation (P250k), CHED (P400k), UniFAST (Listahanan-based).
"""

INCOME_BRACKET_BELOW_250K = "below_250k"
INCOME_BRACKET_250K_400K = "250k_400k"
INCOME_BRACKET_400K_500K = "400k_500k"
INCOME_BRACKET_ABOVE_500K = "above_500k"

INCOME_BRACKETS = {
    INCOME_BRACKET_BELOW_250K: {"min": 0, "max": 250_000, "label": "Below PHP 250,000"},
    INCOME_BRACKET_250K_400K: {"min": 250_001, "max": 400_000, "label": "PHP 250,001 - 400,000"},
    INCOME_BRACKET_400K_500K: {"min": 400_001, "max": 500_000, "label": "PHP 400,001 - 500,000"},
    INCOME_BRACKET_ABOVE_500K: {"min": 500_001, "max": None, "label": "Above PHP 500,000"},
}


def get_income_bracket(annual_income: int | None) -> str | None:
    """
    Map household annual income (PHP) to bracket key.
    Returns None if income is None or invalid.
    """
    if annual_income is None or annual_income < 0:
        return None
    if annual_income <= 250_000:
        return INCOME_BRACKET_BELOW_250K
    if annual_income <= 400_000:
        return INCOME_BRACKET_250K_400K
    if annual_income <= 500_000:
        return INCOME_BRACKET_400K_500K
    return INCOME_BRACKET_ABOVE_500K
