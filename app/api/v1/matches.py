from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from app import models
from app.db import get_db
from app.api.v1.profiles import get_profile_dict
from app.api.v1.scoring import score_scholarship

router = APIRouter()


@router.get("/matches/{profile_id}")
def get_matches(profile_id: int, db: Session = Depends(get_db)):
    profile = get_profile_dict(profile_id, db)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Get all scholarships from database
    scholarships = db.query(models.Scholarship).all()
    results = []

    for scholarship in scholarships:
        # Convert scholarship to dict format
        scholarship_dict = {
            "id": scholarship.id,
            "title": scholarship.title,
            "provider": scholarship.provider,
            "link": scholarship.link,
            "description": scholarship.description,
            "countries": scholarship.countries.split(",") if scholarship.countries else [],
            "regions": scholarship.regions.split(",") if scholarship.regions else [],
            "min_age": scholarship.min_age,
            "max_age": scholarship.max_age,
            "needs_tags": json.loads(scholarship.needs_tags) if scholarship.needs_tags else [],
            "level": getattr(scholarship, "level", None),
            "score": 50,  # Base score
        }
        
        # Calculate match score
        final_score = score_scholarship(profile, scholarship_dict)

        results.append({
            "id": scholarship.id,
            "title": scholarship.title,
            "provider": scholarship.provider,
            "score": final_score,
            "link": scholarship.link,
            "description": scholarship.description,
            "regions": scholarship.regions.split(",") if scholarship.regions else [],
            "min_age": scholarship.min_age,
            "max_age": scholarship.max_age,
        })

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {"matches": results}
