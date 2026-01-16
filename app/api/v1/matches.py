from fastapi import APIRouter, HTTPException
from app.api.v1.profiles import _get_store

router = APIRouter()

# Phase 1: hardcoded scholarship data (in-memory, not DB)
SCHOLARSHIPS = [
    {
        "id": "CHED_CMSP",
        "name": "CHED Merit Scholarship Program",
        "link": "https://ched.gov.ph",
        "score": 90
    },
    {
        "id": "DOST_SEI",
        "name": "DOST-SEI Undergraduate Scholarship",
        "link": "https://ugs.science-scholarships.ph",
        "score": 85
    },
    {
        "id": "SM_FOUNDATION",
        "name": "SM Foundation College Scholarship",
        "link": "https://sm-foundation.org",
        "score": 80
    }
]

@router.get("/matches/{profile_id}")
def get_matches(profile_id: str):
    profiles = _get_store()
    if profile_id not in profiles:
        raise HTTPException(status_code=404, detail="profile not found")

    # Phase 1 behavior: always return top 3 dummy scholarships
    return {"matches": SCHOLARSHIPS}
