"""
Scholarship search API - browse and filter scholarships without running the matching algorithm.
Endpoints: GET /scholarships/search, GET /scholarships/search/filters
"""

import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.v1.scholarships import _scholarship_to_response
from app.db import get_db
from app.limiter import limiter

router = APIRouter(prefix="/scholarships", tags=["scholarship-search"])
logger = logging.getLogger(__name__)


def _parse_json(val, default=None):
    """Parse JSON or CSV string to list."""
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


@router.get("/search/filters", response_model=schemas.ScholarshipFilterOptions)
@limiter.limit("60/minute")
def get_search_filter_options(
    request: Request,
    db: Annotated[Session, Depends(get_db)] = None,
):
    """Return distinct filter values for search UI dropdowns."""
    logger.info("scholarship_search_filters")
    scholarships = (
        db.query(models.Scholarship)
        .filter(models.Scholarship.is_active != False)  # noqa: E712
        .all()
    )
    providers = set()
    education_levels = set()
    regions = set()
    fields_of_study = set()
    for s in scholarships:
        if s.provider and s.provider.strip():
            providers.add(s.provider.strip())
        for level in _parse_json(getattr(s, "eligible_levels", None)):
            if level and str(level).strip():
                education_levels.add(str(level).strip())
        for r in _parse_json(getattr(s, "eligible_regions", None)) or _parse_json(s.regions):
            if r and str(r).strip():
                regions.add(str(r).strip())
        for f in _parse_json(getattr(s, "eligible_courses_psced", None)):
            if f and str(f).strip():
                fields_of_study.add(str(f).strip())
    return schemas.ScholarshipFilterOptions(
        providers=sorted(providers),
        education_levels=sorted(education_levels),
        regions=sorted(regions),
        fields_of_study=sorted(fields_of_study),
    )


@router.get("/search", response_model=schemas.ScholarshipSearchResponse)
@limiter.limit("60/minute")
def search_scholarships(
    request: Request,
    query: str = "",
    region: str = "",
    field: str = "",
    education_level: str = "",
    provider: str = "",
    max_income: int | None = None,
    page: int = 1,
    limit: int = 20,
    db: Annotated[Session, Depends(get_db)] = None,
):
    """
    Search scholarships with optional filters and pagination.
    Does not run the matching algorithm - browse-only.
    """
    logger.info(
        "scholarship_search query=%s region=%s field=%s page=%s",
        query[:50] if query else "",
        region[:30] if region else "",
        field[:30] if field else "",
        page,
    )
    limit = min(max(1, limit), 50)
    page = max(1, page)
    offset = (page - 1) * limit

    q = (
        db.query(models.Scholarship)
        .filter(models.Scholarship.is_active != False)  # noqa: E712
    )

    if query and query.strip():
        pattern = f"%{query.strip()}%"
        q = q.filter(models.Scholarship.title.ilike(pattern))

    if region and region.strip():
        val = region.strip()
        q = q.filter(
            or_(
                models.Scholarship.eligible_regions.ilike(f'%"{val}"%'),
                models.Scholarship.regions.ilike(f"%{val}%"),
            )
        )

    if field and field.strip():
        val = field.strip()
        q = q.filter(
            or_(
                models.Scholarship.eligible_courses_psced.ilike(f'%"{val}"%'),
                models.Scholarship.eligible_courses_psced.ilike(f"%{val}%"),
            )
        )

    if education_level and education_level.strip():
        val = education_level.strip()
        q = q.filter(models.Scholarship.eligible_levels.ilike(f'%"{val}"%'))

    if provider and provider.strip():
        pattern = f"%{provider.strip()}%"
        q = q.filter(models.Scholarship.provider.ilike(pattern))

    if max_income is not None and max_income >= 0:
        q = q.filter(
            or_(
                models.Scholarship.max_income_threshold.is_(None),
                models.Scholarship.max_income_threshold >= max_income,
            )
        )

    total = q.count()
    scholarships = q.offset(offset).limit(limit).all()
    results = [_scholarship_to_response(s) for s in scholarships]
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return schemas.ScholarshipSearchResponse(
        results=results,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
