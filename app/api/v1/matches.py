from typing import Annotated

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session

from app.auth import get_current_user_id, require_profile_owner
from app.db import get_db
from app.limiter import limiter
from app.api.v1.profiles import get_profile_dict
from app.api.v1.scholarships import get_cached_scholarship_dicts
from app.matching.match_service import MatchService

router = APIRouter()
match_service = MatchService()


@router.get("/matches/{profile_id}")
@limiter.limit("30/minute")
def get_matches(
    request: Request,
    profile_id: int,
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Get ranked matches for a profile. Requires auth in production; must own profile."""
    profile = get_profile_dict(profile_id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if user_id is not None:
        require_profile_owner(profile_id, user_id, db)

    scholarship_dicts = get_cached_scholarship_dicts(db)

    results = match_service.get_matches(profile, scholarship_dicts)

    # Ensure backward compatibility: score alias
    for r in results:
        if "final_score" in r and "score" not in r:
            r["score"] = r["final_score"]
        elif "score" in r and "final_score" not in r:
            r["final_score"] = r["score"]

    return {"matches": results}
