"""
PSCED-aligned field-of-study taxonomy.
Philippine Standard Classification of Education (PSCED) broad disciplines and sample courses.
"""

# Field hierarchy: child -> parent(s). Used for matching (e.g. Engineering is subset of STEM).
FIELD_HIERARCHY = {
    "Engineering": ["STEM"],
    "IT": ["STEM"],
    "Science": ["STEM"],
    "Mathematics": ["STEM"],
}

# Broad disciplines (PSCED-aligned) - used for eligibility matching
PSCED_BROAD_DISCIPLINES = {
    "STEM": "Science, Technology, Engineering, Mathematics",
    "Engineering": "Engineering and Technology",
    "IT": "Information Technology",
    "Medical": "Medicine and Health Sciences",
    "Business": "Business and Accountancy",
    "Education": "Education and Teacher Training",
    "Agriculture": "Agriculture, Forestry, Fisheries",
    "Arts": "Arts and Humanities",
    "Law": "Law",
    "Architecture": "Architecture and Planning",
}

# Specific course names - sample mapping for detailed matching
# Keys are broad discipline codes, values are example specific course names
PSCED_SPECIFIC_COURSES = {
    "STEM": [
        "BS Biology",
        "BS Chemistry",
        "BS Physics",
        "BS Mathematics",
        "BS Statistics",
        "BS Computer Science",
        "BS Data Science",
    ],
    "Engineering": [
        "BS Civil Engineering",
        "BS Mechanical Engineering",
        "BS Electrical Engineering",
        "BS Electronics Engineering",
        "BS Chemical Engineering",
        "BS Geodetic Engineering",
        "BS Industrial Engineering",
    ],
    "IT": [
        "BS Information Technology",
        "BS Information Systems",
        "BS Computer Science",
    ],
    "Medical": [
        "BS Nursing",
        "BS Medicine",
        "BS Pharmacy",
        "BS Medical Technology",
        "BS Physical Therapy",
    ],
    "Business": [
        "BS Business Administration",
        "BS Accountancy",
        "BS Internal Auditing",
        "BS Economics",
    ],
    "Education": [
        "BS Education",
        "BEED",
        "BSED",
        "BSE",
    ],
    "Agriculture": [
        "BS Agriculture",
        "BS Agricultural Engineering",
        "BS Forestry",
    ],
    "Arts": [
        "BA Communication",
        "BA Psychology",
        "BA Sociology",
        "BA Literature",
    ],
}
