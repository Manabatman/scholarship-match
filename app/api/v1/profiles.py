import json
import logging
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user_id
from app.config import settings
from app.db import get_db
from app.utils.sanitize import strip_tags

logger = logging.getLogger(__name__)
from app.limiter import limiter
from app.taxonomy.income_brackets import get_income_bracket
from app.taxonomy.gwa_normalizer import normalize_gwa

router = APIRouter()


def _parse_json(val, default=None):
    if val is None:
        return default if default is not None else []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            p = json.loads(val)
            return p if isinstance(p, list) else (default or [])
        except (json.JSONDecodeError, TypeError):
            return [x.strip() for x in val.split(",") if x.strip()] or (default or [])
    return default or []


def _profile_to_response(p):
    return {
        "id": p.id,
        "full_name": p.full_name,
        "email": p.email,
        "age": p.age,
        "region": p.region,
        "school": p.school,
        "needs": _parse_json(p.needs),
        "education_level": p.education_level,
        "gender": getattr(p, "gender", None),
        "birthdate": p.birthdate.isoformat() if getattr(p, "birthdate", None) else None,
        "current_academic_stage": getattr(p, "current_academic_stage", None),
        "target_academic_year": getattr(p, "target_academic_year", None),
        "province": getattr(p, "province", None),
        "city_municipality": getattr(p, "city_municipality", None),
        "barangay": getattr(p, "barangay", None),
        "school_type": getattr(p, "school_type", None),
        "target_school": getattr(p, "target_school", None),
        "gwa_raw": getattr(p, "gwa_raw", None),
        "gwa_scale": getattr(p, "gwa_scale", None),
        "gwa_normalized": getattr(p, "gwa_normalized", None),
        "field_of_study_broad": getattr(p, "field_of_study_broad", None),
        "field_of_study_specific": getattr(p, "field_of_study_specific", None),
        "preferred_courses": _parse_json(getattr(p, "preferred_courses", None), default=[]),
        "extracurriculars": _parse_json(getattr(p, "extracurriculars", None)),
        "awards": _parse_json(getattr(p, "awards", None)),
        "household_income_annual": getattr(p, "household_income_annual", None),
        "income_bracket": getattr(p, "income_bracket", None),
        "is_underprivileged": getattr(p, "is_underprivileged", False) or False,
        "is_pwd": getattr(p, "is_pwd", False) or False,
        "is_indigenous_people": getattr(p, "is_indigenous_people", False) or False,
        "ip_tribe_name": getattr(p, "ip_tribe_name", None),
        "is_solo_parent_dependent": getattr(p, "is_solo_parent_dependent", False) or False,
        "is_ofw_dependent": getattr(p, "is_ofw_dependent", False) or False,
        "ofw_parent_type": getattr(p, "ofw_parent_type", None),
        "is_farmer_fisher_dependent": getattr(p, "is_farmer_fisher_dependent", False) or False,
        "is_4ps_listahanan": getattr(p, "is_4ps_listahanan", False) or False,
        "parent_occupation": getattr(p, "parent_occupation", None),
        "documents": _parse_json(getattr(p, "documents", None), default=[]),
    }


def _profile_to_db_dict(profile: schemas.StudentProfile) -> dict:
    """Convert schema to DB model fields."""
    gwa_norm = profile.gwa_normalized
    if gwa_norm is None and profile.gwa_raw is not None:
        gwa_norm = normalize_gwa(profile.gwa_raw, profile.gwa_scale)

    income_bracket = profile.income_bracket
    if income_bracket is None and profile.household_income_annual is not None:
        income_bracket = get_income_bracket(profile.household_income_annual)

    return {
        "full_name": strip_tags(profile.full_name) or profile.full_name,
        "email": profile.email,
        "age": profile.age,
        "region": profile.region,
        "school": profile.school,
        "needs": json.dumps(profile.needs or []),
        "education_level": profile.education_level,
        "gender": profile.gender,
        "birthdate": profile.birthdate,
        "current_academic_stage": profile.current_academic_stage,
        "target_academic_year": profile.target_academic_year,
        "province": profile.province,
        "city_municipality": profile.city_municipality,
        "barangay": profile.barangay,
        "school_type": profile.school_type,
        "target_school": profile.target_school,
        "gwa_raw": profile.gwa_raw,
        "gwa_scale": profile.gwa_scale,
        "gwa_normalized": gwa_norm or profile.gwa_normalized,
        "field_of_study_broad": profile.field_of_study_broad,
        "field_of_study_specific": profile.field_of_study_specific,
        "preferred_courses": json.dumps((profile.preferred_courses or [])[:3]),
        "extracurriculars": json.dumps(profile.extracurriculars or []),
        "awards": json.dumps(profile.awards or []),
        "household_income_annual": profile.household_income_annual,
        "income_bracket": income_bracket or profile.income_bracket,
        "is_underprivileged": profile.is_underprivileged or False,
        "is_pwd": profile.is_pwd or False,
        "is_indigenous_people": profile.is_indigenous_people or False,
        "ip_tribe_name": profile.ip_tribe_name,
        "is_solo_parent_dependent": profile.is_solo_parent_dependent or False,
        "is_ofw_dependent": profile.is_ofw_dependent or False,
        "ofw_parent_type": profile.ofw_parent_type,
        "is_farmer_fisher_dependent": profile.is_farmer_fisher_dependent or False,
        "is_4ps_listahanan": profile.is_4ps_listahanan or False,
        "parent_occupation": profile.parent_occupation,
        "documents": json.dumps(profile.documents or []),
    }


@router.get("/profiles", response_model=list[schemas.StudentProfileResponse])
def list_profiles(
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """List profiles. When auth enabled, only lists current user's profiles."""
    query = db.query(models.Student)
    if user_id is not None:
        query = query.filter(models.Student.user_id == user_id)
    profiles = query.all()
    return [_profile_to_response(p) for p in profiles]


@router.post("/profiles", response_model=schemas.StudentProfileResponse)
@limiter.limit("20/minute")
def create_profile(
    request: Request,
    profile: schemas.StudentProfile,
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Create or update profile. Requires auth when AUTH_DISABLED=false."""
    if not settings.auth_disabled and user_id is None:
        logger.warning("profile_create_denied email=%s reason=not_authenticated", profile.email)
        raise HTTPException(status_code=401, detail="Not authenticated")
    data = _profile_to_db_dict(profile)
    if user_id is not None:
        data["user_id"] = user_id

    logger.info("profile_create email=%s user_id=%s", profile.email, user_id)

    # Try insert first. If a concurrent request already created this email,
    # the unique constraint fires an IntegrityError and we fall back to update.
    try:
        db_profile = models.Student(**data)
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return _profile_to_response(db_profile)
    except IntegrityError:
        db.rollback()
        logger.warning("profile_create_integrity_fallback email=%s", profile.email)
        existing = db.query(models.Student).filter(
            models.Student.email == profile.email
        ).first()
        if not existing:
            raise HTTPException(status_code=500, detail="Profile conflict")
        for k, v in data.items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return _profile_to_response(existing)


@router.get("/profiles/{profile_id}", response_model=schemas.StudentProfileResponse)
def get_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    profile = db.query(models.Student).filter(models.Student.id == profile_id).first()
    if not profile:
        logger.warning("profile_get_not_found profile_id=%s", profile_id)
        raise HTTPException(status_code=404, detail="Profile not found")
    if user_id is not None and profile.user_id is not None and profile.user_id != user_id:
        logger.warning("profile_access_denied profile_id=%s user_id=%s", profile_id, user_id)
        raise HTTPException(status_code=403, detail="Access denied")
    return _profile_to_response(profile)


def get_profile_dict(profile_id: int, db: Session) -> dict | None:
    """Helper: get profile as dict for matching."""
    profile = db.query(models.Student).filter(models.Student.id == profile_id).first()
    if not profile:
        return None
    return _profile_to_response(profile)
