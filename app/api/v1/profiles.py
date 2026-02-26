from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from app import models, schemas
from app.db import get_db

router = APIRouter()


def _profile_to_response(p):
    return {
        "id": p.id,
        "full_name": p.full_name,
        "email": p.email,
        "age": p.age,
        "region": p.region,
        "school": p.school,
        "needs": json.loads(p.needs) if p.needs else [],
        "education_level": p.education_level,
    }


@router.post("/profiles", response_model=schemas.StudentProfileResponse)
def create_profile(profile: schemas.StudentProfile, db: Session = Depends(get_db)):
    existing = db.query(models.Student).filter(models.Student.email == profile.email).first()
    if existing:
        existing.full_name = profile.full_name
        existing.age = profile.age
        existing.region = profile.region
        existing.school = profile.school
        existing.needs = json.dumps(profile.needs or [])
        existing.education_level = profile.education_level
        db.commit()
        db.refresh(existing)
        return _profile_to_response(existing)

    db_profile = models.Student(
        full_name=profile.full_name,
        email=profile.email,
        age=profile.age,
        region=profile.region,
        school=profile.school,
        needs=json.dumps(profile.needs or []),
        education_level=profile.education_level,
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return _profile_to_response(db_profile)


@router.get("/profiles/{profile_id}", response_model=schemas.StudentProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.Student).filter(models.Student.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "id": profile.id,
        "full_name": profile.full_name,
        "email": profile.email,
        "age": profile.age,
        "region": profile.region,
        "school": profile.school,
        "needs": json.loads(profile.needs) if profile.needs else [],
        "education_level": profile.education_level,
    }


def get_profile_dict(profile_id: int, db: Session) -> dict:
    """Helper function to get profile as dict for matching"""
    profile = db.query(models.Student).filter(models.Student.id == profile_id).first()
    if not profile:
        return None
    
    return {
        "id": profile.id,
        "full_name": profile.full_name,
        "email": profile.email,
        "age": profile.age,
        "region": profile.region,
        "school": profile.school,
        "needs": json.loads(profile.needs) if profile.needs else [],
        "education_level": profile.education_level,
    }
