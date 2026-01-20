from fastapi import APIRouter, HTTPException
from app.api.v1.profiles import _get_store
from app.api.v1.scoring import score_scholarship

router = APIRouter()

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
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = profiles[profile_id]
    results = []

    for scholarship in SCHOLARSHIPS:
        final_score = score_scholarship(profile, scholarship)

        results.append({
            **scholarship,
            "score": final_score
        })

    return {"matches": results}
