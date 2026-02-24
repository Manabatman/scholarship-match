from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from app import models, schemas
from app.db import get_db

router = APIRouter()


@router.post("/profiles", response_model=schemas.StudentProfileResponse)
def create_profile(profile: schemas.StudentProfile, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(models.Student).filter(models.Student.email == profile.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_profile = models.Student(
        full_name=profile.full_name,
        email=profile.email,
        age=profile.age,
        region=profile.region,
        school=profile.school,
        needs=json.dumps(profile.needs or []),
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    return {
        "id": db_profile.id,
        "full_name": db_profile.full_name,
        "email": db_profile.email,
        "age": db_profile.age,
        "region": db_profile.region,
        "school": db_profile.school,
        "needs": json.loads(db_profile.needs) if db_profile.needs else [],
    }


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
    }
