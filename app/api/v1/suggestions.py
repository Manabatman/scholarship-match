"""
Autocomplete suggestions API for profile form fields.
Endpoints: schools, courses, regions, provinces, scholarships.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.limiter import limiter
from app.models import Scholarship
from app.taxonomy.provinces import ALL_PROVINCES, PROVINCES_BY_REGION
from app.taxonomy.psced_fields import PSCED_SPECIFIC_COURSES
from app.taxonomy.regions import PHILIPPINE_REGIONS
from app.taxonomy.schools import PHILIPPINE_SCHOOLS
from app.utils.fuzzy_search import fuzzy_search

router = APIRouter(prefix="/suggestions", tags=["suggestions"])
logger = logging.getLogger(__name__)

# Flatten courses from PSCED taxonomy
ALL_COURSES: list[str] = []
for courses in PSCED_SPECIFIC_COURSES.values():
    for c in courses:
        if c not in ALL_COURSES:
            ALL_COURSES.append(c)


@router.get("/schools")
@limiter.limit("60/minute")
def get_school_suggestions(request: Request, q: str = ""):
    """Suggest schools matching query. Fuzzy search over curated HEI list."""
    logger.info("suggestions_schools q=%s", q[:50] if q else "")
    results = fuzzy_search(q, list(PHILIPPINE_SCHOOLS), limit=10)
    return {"suggestions": results}


@router.get("/courses")
@limiter.limit("60/minute")
def get_course_suggestions(request: Request, q: str = ""):
    """Suggest courses matching query. Fuzzy search over PSCED taxonomy."""
    logger.info("suggestions_courses q=%s", q[:50] if q else "")
    results = fuzzy_search(q, ALL_COURSES, limit=10)
    return {"suggestions": results}


@router.get("/regions")
@limiter.limit("60/minute")
def get_region_suggestions(request: Request, q: str = ""):
    """Suggest regions matching query. Fuzzy search over Philippine regions."""
    logger.info("suggestions_regions q=%s", q[:50] if q else "")
    results = fuzzy_search(q, list(PHILIPPINE_REGIONS), limit=10)
    return {"suggestions": results}


@router.get("/provinces")
@limiter.limit("60/minute")
def get_province_suggestions(request: Request, q: str = "", region: str = ""):
    """Suggest provinces matching query. Optionally filter by region."""
    logger.info("suggestions_provinces q=%s region=%s", q[:50] if q else "", region[:30] if region else "")
    pool = PROVINCES_BY_REGION.get(region.strip(), ALL_PROVINCES) if region and region.strip() else ALL_PROVINCES
    results = fuzzy_search(q, pool, limit=10)
    return {"suggestions": results}


@router.get("/scholarships")
@limiter.limit("60/minute")
def get_scholarship_suggestions(
    request: Request,
    q: str = "",
    db: Annotated[Session, Depends(get_db)] = None,
):
    """Suggest scholarships by title. Queries DB with ILIKE."""
    logger.info("suggestions_scholarships q=%s", q[:50] if q else "")
    if not q or not q.strip():
        return {"suggestions": []}
    pattern = f"%{q.strip()}%"
    rows = (
        db.query(Scholarship.title)
        .filter(Scholarship.is_active == True, Scholarship.title.ilike(pattern))
        .limit(10)
        .all()
    )
    suggestions = [r[0] for r in rows if r[0]]
    return {"suggestions": suggestions}
