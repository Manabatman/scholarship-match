from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from app import models, schemas
from app.db import get_db

router = APIRouter()


@router.post("/scholarships")
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
        link=scholarship.link,
        description=scholarship.description,
    )
    db.add(db_scholarship)
    db.commit()
    db.refresh(db_scholarship)
    return {"id": db_scholarship.id}


@router.get("/scholarships")
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
            "link": s.link,
            "description": s.description,
        }
        for s in scholarships
    ]
