"""
Philippine region constants and normalization.
Expanded from original REGION_ALIASES for LGU and geographic matching.
"""

# Region aliases: map common user inputs to canonical names
REGION_ALIASES = {
    "ncr": "metro manila",
    "national capital region": "metro manila",
    "metro manila": "metro manila",
    "ncr - metro manila": "metro manila",
    "calabarzon": "luzon",
    "central luzon": "luzon",
    "ilocos": "luzon",
    "ilocos region": "luzon",
    "bicol": "luzon",
    "bicol region": "luzon",
    "car": "luzon",
    "cordillera": "luzon",
    "mimaropa": "luzon",
    "cagayan valley": "luzon",
    "luzon": "luzon",
    "western visayas": "visayas",
    "central visayas": "visayas",
    "eastern visayas": "visayas",
    "visayas": "visayas",
    "region vi": "visayas",
    "region vii": "visayas",
    "region viii": "visayas",
    "zamboanga": "mindanao",
    "zamboanga peninsula": "mindanao",
    "northern mindanao": "mindanao",
    "davao region": "mindanao",
    "davao": "mindanao",
    "region xi": "mindanao",
    "soccsksargen": "mindanao",
    "caraga": "mindanao",
    "barmm": "mindanao",
    "bangsamoro": "mindanao",
    "mindanao": "mindanao",
}


# Canonical Philippine regions (17 regions)
PHILIPPINE_REGIONS = [
    "NCR",
    "CAR",
    "Region I - Ilocos",
    "Region II - Cagayan Valley",
    "Region III - Central Luzon",
    "Region IV-A - Calabarzon",
    "Region IV-B - Mimaropa",
    "Region V - Bicol",
    "Region VI - Western Visayas",
    "Region VII - Central Visayas",
    "Region VIII - Eastern Visayas",
    "Region IX - Zamboanga Peninsula",
    "Region X - Northern Mindanao",
    "Region XI - Davao",
    "Region XII - Soccsksargen",
    "Region XIII - Caraga",
    "BARMM",
]

# Island groups for coarse matching
ISLAND_GROUPS = {
    "metro manila": "luzon",
    "luzon": "luzon",
    "visayas": "visayas",
    "mindanao": "mindanao",
}


def normalize_region(region: str | None) -> str:
    """Normalize region for matching (e.g. NCR -> metro manila)."""
    if not region or not str(region).strip():
        return ""
    key = str(region).strip().lower()
    return REGION_ALIASES.get(key, key)
