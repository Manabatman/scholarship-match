"""
Philippine provinces grouped by region.
PSA-aligned for geographic matching and autocomplete.
"""

from app.taxonomy.regions import PHILIPPINE_REGIONS

# Provinces by region - keys match PHILIPPINE_REGIONS
PROVINCES_BY_REGION: dict[str, list[str]] = {
    "NCR": [
        "Caloocan",
        "Las Piñas",
        "Makati",
        "Malabon",
        "Mandaluyong",
        "Manila",
        "Marikina",
        "Muntinlupa",
        "Navotas",
        "Parañaque",
        "Pasay",
        "Pasig",
        "Pateros",
        "Quezon City",
        "San Juan",
        "Taguig",
        "Valenzuela",
    ],
    "CAR": [
        "Abra",
        "Apayao",
        "Benguet",
        "Ifugao",
        "Kalinga",
        "Mountain Province",
    ],
    "Region I - Ilocos": [
        "Ilocos Norte",
        "Ilocos Sur",
        "La Union",
        "Pangasinan",
    ],
    "Region II - Cagayan Valley": [
        "Batanes",
        "Cagayan",
        "Isabela",
        "Nueva Vizcaya",
        "Quirino",
    ],
    "Region III - Central Luzon": [
        "Aurora",
        "Bataan",
        "Bulacan",
        "Nueva Ecija",
        "Pampanga",
        "Tarlac",
        "Zambales",
    ],
    "Region IV-A - Calabarzon": [
        "Batangas",
        "Cavite",
        "Laguna",
        "Quezon",
        "Rizal",
    ],
    "Region IV-B - Mimaropa": [
        "Marinduque",
        "Occidental Mindoro",
        "Oriental Mindoro",
        "Palawan",
        "Romblon",
    ],
    "Region V - Bicol": [
        "Albay",
        "Camarines Norte",
        "Camarines Sur",
        "Catanduanes",
        "Masbate",
        "Sorsogon",
    ],
    "Region VI - Western Visayas": [
        "Aklan",
        "Antique",
        "Capiz",
        "Guimaras",
        "Iloilo",
        "Negros Occidental",
    ],
    "Region VII - Central Visayas": [
        "Bohol",
        "Cebu",
        "Negros Oriental",
        "Siquijor",
    ],
    "Region VIII - Eastern Visayas": [
        "Biliran",
        "Eastern Samar",
        "Leyte",
        "Northern Samar",
        "Samar",
        "Southern Leyte",
    ],
    "Region IX - Zamboanga Peninsula": [
        "Zamboanga del Norte",
        "Zamboanga del Sur",
        "Zamboanga Sibugay",
    ],
    "Region X - Northern Mindanao": [
        "Bukidnon",
        "Camiguin",
        "Lanao del Norte",
        "Misamis Occidental",
        "Misamis Oriental",
    ],
    "Region XI - Davao": [
        "Davao de Oro",
        "Davao del Norte",
        "Davao del Sur",
        "Davao Occidental",
        "Davao Oriental",
    ],
    "Region XII - Soccsksargen": [
        "Cotabato",
        "Sarangani",
        "South Cotabato",
        "Sultan Kudarat",
    ],
    "Region XIII - Caraga": [
        "Agusan del Norte",
        "Agusan del Sur",
        "Dinagat Islands",
        "Surigao del Norte",
        "Surigao del Sur",
    ],
    "BARMM": [
        "Basilan",
        "Lanao del Sur",
        "Maguindanao del Norte",
        "Maguindanao del Sur",
        "Sulu",
        "Tawi-Tawi",
    ],
}

# Flattened list for search when region is not specified
ALL_PROVINCES: list[str] = []
for r in PHILIPPINE_REGIONS:
    if r in PROVINCES_BY_REGION:
        ALL_PROVINCES.extend(PROVINCES_BY_REGION[r])
