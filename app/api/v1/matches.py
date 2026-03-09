from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.api.v1.profiles import get_profile_dict
from app.api.v1.scholarships import get_cached_scholarship_dicts
from app.matching.match_service import MatchService

router = APIRouter()
match_service = MatchService()


@router.get("/matches/{profile_id}")
def get_matches(profile_id: int, db: Session = Depends(get_db)):
    profile = get_profile_dict(profile_id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    scholarship_dicts = get_cached_scholarship_dicts(db)

    results = match_service.get_matches(profile, scholarship_dicts)

    # Ensure backward compatibility: score alias
    for r in results:
        if "final_score" in r and "score" not in r:
            r["score"] = r["final_score"]
        elif "score" in r and "final_score" not in r:
            r["final_score"] = r["score"]

    return {"matches": results}
