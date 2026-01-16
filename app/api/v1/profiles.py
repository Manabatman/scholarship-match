from fastapi import APIRouter, HTTPException
from app.schemas import StudentProfile
import uuid

router = APIRouter()
_profiles = {}

@router.post("/profiles")
def create_profile(profile: StudentProfile):
    pid = str(uuid.uuid4())
    _profiles[pid] = profile.dict()
    return {"id": pid}

@router.get("/profiles/{profile_id}")
def get_profile(profile_id: str):
    profile = _profiles.get(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    return profile

def _get_store():
    return _profiles
