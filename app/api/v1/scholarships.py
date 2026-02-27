from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from app import models, schemas
from app.db import get_db

router = APIRouter()


@router.post("/scholarships", response_model=schemas.ScholarshipResponse)
def create_scholarship(
    scholarship: schemas.Scholarship,
    db: Session = Depends(get_db),
):
    db_scholarship = models.Scholarship(
        title=scholarship.title,
        provider=scholarship.provider,
        countries=",".join(scholarship.countries or []),
        regions=",".join(scholarship.regions or []),
        min_age=scholarship.min_age,
        max_age=scholarship.max_age,
        needs_tags=json.dumps(scholarship.needs_tags or []),
        level=scholarship.level,
        link=scholarship.link,
        description=scholarship.description,
    )
    db.add(db_scholarship)
    db.commit()
    db.refresh(db_scholarship)
    
    return {
        "id": db_scholarship.id,
        "title": db_scholarship.title,
        "provider": db_scholarship.provider,
        "countries": db_scholarship.countries.split(",") if db_scholarship.countries else [],
        "regions": db_scholarship.regions.split(",") if db_scholarship.regions else [],
        "min_age": db_scholarship.min_age,
        "max_age": db_scholarship.max_age,
        "needs_tags": json.loads(db_scholarship.needs_tags) if db_scholarship.needs_tags else [],
        "level": getattr(db_scholarship, "level", None),
        "link": db_scholarship.link,
        "description": db_scholarship.description,
    }


@router.get("/scholarships", response_model=list[schemas.ScholarshipResponse])
def list_scholarships(db: Session = Depends(get_db)):
    scholarships = db.query(models.Scholarship).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "provider": s.provider,
            "countries": s.countries.split(",") if s.countries else [],
            "regions": s.regions.split(",") if s.regions else [],
            "min_age": s.min_age,
            "max_age": s.max_age,
            "needs_tags": json.loads(s.needs_tags) if s.needs_tags else [],
            "level": getattr(s, "level", None),
            "link": s.link,
            "description": s.description,
        }
        for s in scholarships
    ]
