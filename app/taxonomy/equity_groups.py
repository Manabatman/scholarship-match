"""
RA-based equity group definitions for Philippine scholarship matching.
Legislative basis for priority classification flags.
"""

# Equity group IDs used in profile flags and scholarship priority_groups
EQUITY_GROUP_IDS = [
    "Underprivileged",       # RA 7279
    "PWD",                   # RA 7277
    "IP",                    # RA 8371 (IPRA)
    "Solo Parent Dependent", # RA 11861
    "OFW Dependent",         # OWWA mandate
    "Farmer/Fisher Dependent",
    "4Ps/Listahanan",        # Pantawid Pamilyang Pilipino Program
]

EQUITY_GROUPS = {
    "Underprivileged": {
        "label": "Underprivileged / Homeless",
        "ra_reference": "RA 7279",
        "profile_flag": "is_underprivileged",
    },
    "PWD": {
        "label": "Person with Disability",
        "ra_reference": "RA 7277",
        "profile_flag": "is_pwd",
    },
    "IP": {
        "label": "Indigenous Peoples",
        "ra_reference": "RA 8371 (IPRA)",
        "profile_flag": "is_indigenous_people",
    },
    "Solo Parent Dependent": {
        "label": "Solo Parent Dependent",
        "ra_reference": "RA 11861",
        "profile_flag": "is_solo_parent_dependent",
    },
    "OFW Dependent": {
        "label": "OFW Dependent",
        "ra_reference": "OWWA",
        "profile_flag": "is_ofw_dependent",
    },
    "Farmer/Fisher Dependent": {
        "label": "Farmer/Fisher Dependent",
        "ra_reference": "Landbank/Agrarian",
        "profile_flag": "is_farmer_fisher_dependent",
    },
    "4Ps/Listahanan": {
        "label": "4Ps / Listahanan 2.0",
        "ra_reference": "Pantawid Pamilyang Pilipino Program",
        "profile_flag": "is_4ps_listahanan",
    },
}
