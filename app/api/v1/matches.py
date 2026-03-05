from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.api.v1.profiles import get_profile_dict
from app.api.v1.scholarships import _scholarship_to_dict
from app.matching.match_service import MatchService

router = APIRouter()
match_service = MatchService()


@router.get("/matches/{profile_id}")
def get_matches(profile_id: int, db: Session = Depends(get_db)):
    profile = get_profile_dict(profile_id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    scholarships = db.query(models.Scholarship).filter(
        models.Scholarship.is_active != False  # noqa: E712
    ).all()
    scholarship_dicts = [_scholarship_to_dict(s) for s in scholarships]

    results = match_service.get_matches(profile, scholarship_dicts)

    # Ensure backward compatibility: score alias
    for r in results:
        if "final_score" in r and "score" not in r:
            r["score"] = r["final_score"]
        elif "score" in r and "final_score" not in r:
            r["final_score"] = r["score"]

    return {"matches": results}
