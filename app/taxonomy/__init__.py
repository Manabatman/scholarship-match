"""Philippine policy-aligned taxonomy constants and utilities."""

from app.taxonomy.income_brackets import (
    INCOME_BRACKETS,
    get_income_bracket,
    INCOME_BRACKET_BELOW_250K,
    INCOME_BRACKET_250K_400K,
    INCOME_BRACKET_400K_500K,
    INCOME_BRACKET_ABOVE_500K,
)
from app.taxonomy.psced_fields import PSCED_BROAD_DISCIPLINES, PSCED_SPECIFIC_COURSES
from app.taxonomy.gwa_normalizer import normalize_gwa, GWA_SCALE_5_0, GWA_SCALE_4_0, GWA_SCALE_PERCENTAGE
from app.taxonomy.regions import REGION_ALIASES, PHILIPPINE_REGIONS, normalize_region
from app.taxonomy.equity_groups import EQUITY_GROUPS, EQUITY_GROUP_IDS

__all__ = [
    "INCOME_BRACKETS",
    "get_income_bracket",
    "INCOME_BRACKET_BELOW_250K",
    "INCOME_BRACKET_250K_400K",
    "INCOME_BRACKET_400K_500K",
    "INCOME_BRACKET_ABOVE_500K",
    "PSCED_BROAD_DISCIPLINES",
    "PSCED_SPECIFIC_COURSES",
    "normalize_gwa",
    "GWA_SCALE_5_0",
    "GWA_SCALE_4_0",
    "GWA_SCALE_PERCENTAGE",
    "REGION_ALIASES",
    "PHILIPPINE_REGIONS",
    "normalize_region",
    "EQUITY_GROUPS",
    "EQUITY_GROUP_IDS",
]
