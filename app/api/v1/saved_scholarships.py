"""
Saved scholarships (bookmarks) API.
Endpoints: POST/GET /saved-scholarships, GET /saved-scholarships/ids, DELETE /saved-scholarships/{scholarship_id}
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.v1.scholarships import _scholarship_to_response
from app.auth import get_current_user_id
from app.db import get_db
from app.limiter import limiter

router = APIRouter(prefix="/saved-scholarships", tags=["saved-scholarships"])
logger = logging.getLogger(__name__)


def _require_user_id(user_id: int | None) -> int:
    """Raise 401 if not authenticated. Saved scholarships requires auth."""
    if user_id is None:
        logger.warning("saved_scholarships_denied reason=not_authenticated")
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


@router.get("/ids")
@limiter.limit("60/minute")
def get_saved_scholarship_ids(
    request: Request,
    db: Annotated[Session, Depends(get_db)] = None,
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Return list of scholarship IDs saved by the current user. Lightweight for bookmark check."""
    uid = _require_user_id(user_id)
    rows = (
        db.query(models.SavedScholarship.scholarship_id)
        .filter(models.SavedScholarship.user_id == uid)
        .all()
    )
    ids = [r[0] for r in rows if r[0] is not None]
    logger.info("saved_scholarships_ids user_id=%s count=%s", uid, len(ids))
    return {"scholarship_ids": ids}


@router.post("", response_model=schemas.SavedScholarshipResponse)
@limiter.limit("60/minute")
def save_scholarship(
    request: Request,
    body: schemas.SaveScholarshipRequest,
    db: Annotated[Session, Depends(get_db)] = None,
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Save a scholarship for the current user. Returns 409 if already saved."""
    uid = _require_user_id(user_id)

    scholarship = (
        db.query(models.Scholarship)
        .filter(
            models.Scholarship.id == body.scholarship_id,
            models.Scholarship.is_active != False,  # noqa: E712
        )
        .first()
    )
    if not scholarship:
        logger.warning("saved_scholarships_save_not_found scholarship_id=%s", body.scholarship_id)
        raise HTTPException(status_code=404, detail="Scholarship not found")

    existing = (
        db.query(models.SavedScholarship)
        .filter(
            models.SavedScholarship.user_id == uid,
            models.SavedScholarship.scholarship_id == body.scholarship_id,
        )
        .first()
    )
    if existing:
        logger.info("saved_scholarships_save_duplicate user_id=%s scholarship_id=%s", uid, body.scholarship_id)
        raise HTTPException(status_code=409, detail="Scholarship already saved")

    saved = models.SavedScholarship(user_id=uid, scholarship_id=body.scholarship_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)

    logger.info("saved_scholarships_saved id=%s user_id=%s scholarship_id=%s", saved.id, uid, body.scholarship_id)

    return schemas.SavedScholarshipResponse(
        id=saved.id,
        scholarship_id=saved.scholarship_id,
        created_at=saved.created_at,
        scholarship=_scholarship_to_response(scholarship),
    )


@router.get("", response_model=schemas.SavedScholarshipListResponse)
@limiter.limit("60/minute")
def list_saved_scholarships(
    request: Request,
    db: Annotated[Session, Depends(get_db)] = None,
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """List all saved scholarships for the current user with full scholarship details."""
    uid = _require_user_id(user_id)

    saved_list = (
        db.query(models.SavedScholarship)
        .filter(models.SavedScholarship.user_id == uid)
        .order_by(models.SavedScholarship.created_at.desc())
        .all()
    )
    scholarship_ids = [s.scholarship_id for s in saved_list]
    scholarships = {
        s.id: s
        for s in db.query(models.Scholarship).filter(models.Scholarship.id.in_(scholarship_ids)).all()
    }

    items = []
    for s in saved_list:
        sch = scholarships.get(s.scholarship_id)
        if sch:
            items.append(
                schemas.SavedScholarshipResponse(
                    id=s.id,
                    scholarship_id=s.scholarship_id,
                    created_at=s.created_at,
                    scholarship=_scholarship_to_response(sch),
                )
            )
        else:
            items.append(
                schemas.SavedScholarshipResponse(
                    id=s.id,
                    scholarship_id=s.scholarship_id,
                    created_at=s.created_at,
                    scholarship=None,
                )
            )

    logger.info("saved_scholarships_list user_id=%s count=%s", uid, len(items))
    return schemas.SavedScholarshipListResponse(saved=items, total=len(items))


@router.delete("/{scholarship_id}")
@limiter.limit("60/minute")
def unsave_scholarship(
    request: Request,
    scholarship_id: int,
    db: Annotated[Session, Depends(get_db)] = None,
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Remove a scholarship from the user's saved list."""
    uid = _require_user_id(user_id)

    deleted = (
        db.query(models.SavedScholarship)
        .filter(
            models.SavedScholarship.user_id == uid,
            models.SavedScholarship.scholarship_id == scholarship_id,
        )
        .delete()
    )
    db.commit()

    if deleted == 0:
        logger.info("saved_scholarships_unsave_not_found user_id=%s scholarship_id=%s", uid, scholarship_id)
        return {"status": "removed"}

    logger.info("saved_scholarships_unsaved user_id=%s scholarship_id=%s", uid, scholarship_id)
    return {"status": "removed"}
