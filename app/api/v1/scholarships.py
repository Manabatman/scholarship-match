from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json
import time

from app import models, schemas
from app.db import get_db

router = APIRouter()

_scholarship_cache: list | None = None
_scholarship_cache_time: float = 0.0
_SCHOLARSHIP_TTL: int = 300  # 5 minutes


def _invalidate_scholarship_cache():
    global _scholarship_cache, _scholarship_cache_time
    _scholarship_cache = None
    _scholarship_cache_time = 0.0


def get_cached_scholarship_dicts(db: Session) -> list[dict]:
    """Return scholarship dicts from cache, querying DB on miss or TTL expiry."""
    global _scholarship_cache, _scholarship_cache_time
    now = time.monotonic()
    if _scholarship_cache is not None and (now - _scholarship_cache_time) < _SCHOLARSHIP_TTL:
        return _scholarship_cache
    scholarships = db.query(models.Scholarship).filter(
        models.Scholarship.is_active != False  # noqa: E712
    ).all()
    _scholarship_cache = [_scholarship_to_dict(s) for s in scholarships]
    _scholarship_cache_time = now
    return _scholarship_cache


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


def _scholarship_to_response(s):
    regions = _parse_json(s.regions)
    if not regions and getattr(s, "eligible_regions", None):
        regions = _parse_json(s.eligible_regions)
    return {
        "id": s.id,
        "title": s.title,
        "provider": s.provider,
        "countries": _parse_json(s.countries),
        "regions": regions,
        "min_age": s.min_age,
        "max_age": s.max_age,
        "needs_tags": _parse_json(s.needs_tags),
        "level": getattr(s, "level", None),
        "link": s.link,
        "description": s.description,
        "provider_type": getattr(s, "provider_type", None),
        "scholarship_type": getattr(s, "scholarship_type", None),
        "eligible_levels": _parse_json(getattr(s, "eligible_levels", None)),
        "eligible_regions": _parse_json(getattr(s, "eligible_regions", None)),
        "eligible_cities": _parse_json(getattr(s, "eligible_cities", None)),
        "residency_required": getattr(s, "residency_required", False) or False,
        "eligible_school_types": _parse_json(getattr(s, "eligible_school_types", None)),
        "eligible_courses_psced": _parse_json(getattr(s, "eligible_courses_psced", None)),
        "max_income_threshold": getattr(s, "max_income_threshold", None),
        "min_gwa_normalized": getattr(s, "min_gwa_normalized", None),
        "priority_groups": _parse_json(getattr(s, "priority_groups", None)),
        "benefit_tuition": getattr(s, "benefit_tuition", False) or False,
        "benefit_allowance_monthly": getattr(s, "benefit_allowance_monthly", None),
        "benefit_books": getattr(s, "benefit_books", False) or False,
        "benefit_total_value": getattr(s, "benefit_total_value", None),
        "required_documents": _parse_json(getattr(s, "required_documents", None)),
        "has_qualifying_exam": getattr(s, "has_qualifying_exam", False) or False,
        "has_interview": getattr(s, "has_interview", False) or False,
        "has_essay_requirement": getattr(s, "has_essay_requirement", False) or False,
        "has_return_service": getattr(s, "has_return_service", False) or False,
        "application_deadline": getattr(s, "application_deadline", None),
        "application_open_date": getattr(s, "application_open_date", None),
        "academic_year_target": getattr(s, "academic_year_target", None),
        "is_active": getattr(s, "is_active", True),
    }


def _scholarship_to_dict(s):
    """Full dict for matching (includes all fields)."""
    d = _scholarship_to_response(s)
    ad = getattr(s, "application_deadline", None)
    d["application_deadline"] = ad.isoformat() if ad and hasattr(ad, "isoformat") else ad
    return d


@router.post("/scholarships", response_model=schemas.ScholarshipResponse)
def create_scholarship(scholarship: schemas.Scholarship, db: Session = Depends(get_db)):
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
        provider_type=scholarship.provider_type,
        scholarship_type=scholarship.scholarship_type,
        eligible_levels=json.dumps(scholarship.eligible_levels or []),
        eligible_regions=json.dumps(scholarship.eligible_regions or scholarship.regions or []),
        eligible_cities=json.dumps(scholarship.eligible_cities or []),
        residency_required=scholarship.residency_required or False,
        eligible_school_types=json.dumps(scholarship.eligible_school_types or ["Public", "Private"]),
        eligible_courses_psced=json.dumps(scholarship.eligible_courses_psced or []),
        max_income_threshold=scholarship.max_income_threshold,
        min_gwa_normalized=scholarship.min_gwa_normalized,
        priority_groups=json.dumps(scholarship.priority_groups or []),
        benefit_tuition=scholarship.benefit_tuition or False,
        benefit_allowance_monthly=scholarship.benefit_allowance_monthly,
        benefit_books=scholarship.benefit_books or False,
        benefit_total_value=scholarship.benefit_total_value,
        required_documents=json.dumps(scholarship.required_documents or []),
        has_qualifying_exam=scholarship.has_qualifying_exam or False,
        has_interview=scholarship.has_interview or False,
        has_essay_requirement=scholarship.has_essay_requirement or False,
        has_return_service=scholarship.has_return_service or False,
        application_deadline=scholarship.application_deadline,
        application_open_date=scholarship.application_open_date,
        academic_year_target=scholarship.academic_year_target,
        is_active=scholarship.is_active if scholarship.is_active is not None else True,
    )
    db.add(db_scholarship)
    db.commit()
    db.refresh(db_scholarship)
    _invalidate_scholarship_cache()
    return _scholarship_to_response(db_scholarship)


@router.get("/scholarships", response_model=list[schemas.ScholarshipResponse])
def list_scholarships(db: Session = Depends(get_db)):
    return get_cached_scholarship_dicts(db)
