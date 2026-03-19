"""Match history endpoints: save and retrieve past match runs."""
import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user_id, require_profile_owner
from app.db import get_db
from app.limiter import limiter
from app.api.v1.profiles import get_profile_dict
from app.api.v1.scholarships import get_cached_scholarship_dicts
from app.matching.match_service import MatchService

router = APIRouter()
match_service = MatchService()
logger = logging.getLogger(__name__)


def _require_user_id(user_id: int | None) -> int:
    """Raise 401 if not authenticated. Match history requires auth."""
    if user_id is None:
        logger.warning("match_history_denied reason=not_authenticated")
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


def _result_to_match_response(r: models.MatchResult, scholarship: models.Scholarship) -> dict:
    """Build match response dict from MatchResult + Scholarship for display."""
    regions = []
    if scholarship.regions:
        regions = [x.strip() for x in scholarship.regions.split(",") if x.strip()]
    if not regions and scholarship.eligible_regions:
        try:
            regions = json.loads(scholarship.eligible_regions) if isinstance(scholarship.eligible_regions, str) else scholarship.eligible_regions or []
        except (json.JSONDecodeError, TypeError):
            regions = []
    score = r.final_score if r.final_score is not None else r.score
    return {
        "id": scholarship.id,
        "title": scholarship.title,
        "provider": scholarship.provider,
        "score": score,
        "final_score": score,
        "explanation": json.loads(r.explanation) if r.explanation else [],
        "breakdown": json.loads(r.breakdown) if r.breakdown else None,
        "link": scholarship.link,
        "description": scholarship.description,
        "regions": regions,
        "min_age": scholarship.min_age,
        "max_age": scholarship.max_age,
        "level": scholarship.level,
        "provider_type": scholarship.provider_type,
        "scholarship_type": scholarship.scholarship_type,
        "benefit_tuition": scholarship.benefit_tuition,
        "benefit_allowance_monthly": scholarship.benefit_allowance_monthly,
        "benefit_books": scholarship.benefit_books,
        "benefit_total_value": scholarship.benefit_total_value,
        "application_deadline": scholarship.application_deadline.isoformat() if scholarship.application_deadline else None,
        "required_documents": json.loads(scholarship.required_documents) if scholarship.required_documents else [],
    }


@router.post("/match-runs")
@limiter.limit("20/minute")
def create_match_run(
    request: Request,
    body: schemas.CreateMatchRunRequest,
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Run matching for a profile, save results, return run + matches. Requires auth."""
    uid = _require_user_id(user_id)
    require_profile_owner(body.profile_id, uid, db)

    profile = get_profile_dict(body.profile_id, db)
    if not profile:
        logger.warning("match_run_profile_not_found profile_id=%s user_id=%s", body.profile_id, uid)
        raise HTTPException(status_code=404, detail="Profile not found")

    scholarship_dicts = get_cached_scholarship_dicts(db)
    results = match_service.get_matches(profile, scholarship_dicts)

    for r in results:
        if "final_score" in r and "score" not in r:
            r["score"] = r["final_score"]
        elif "score" in r and "final_score" not in r:
            r["final_score"] = r["score"]

    run = models.MatchRun(user_id=uid, profile_id=body.profile_id)
    db.add(run)
    db.commit()
    db.refresh(run)

    for r in results:
        mr = models.MatchResult(
            run_id=run.id,
            scholarship_id=r["id"],
            score=r.get("score", r.get("final_score", 0)),
            final_score=r.get("final_score", r.get("score")),
            explanation=json.dumps(r.get("explanation") or []),
            breakdown=json.dumps(r.get("breakdown")) if r.get("breakdown") else None,
        )
        db.add(mr)
    db.commit()

    logger.info("match_run_created run_id=%s user_id=%s profile_id=%s results=%s", run.id, uid, body.profile_id, len(results))

    return {
        "run_id": run.id,
        "profile_id": body.profile_id,
        "created_at": run.created_at.isoformat(),
        "matches": results,
    }


@router.get("/match-runs/compare", response_model=schemas.MatchComparisonResponse)
def compare_match_runs(
    run_a: int,
    run_b: int,
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Compare two match runs side-by-side. Requires auth and ownership."""
    uid = _require_user_id(user_id)

    run_a_obj = db.query(models.MatchRun).filter(models.MatchRun.id == run_a, models.MatchRun.user_id == uid).first()
    run_b_obj = db.query(models.MatchRun).filter(models.MatchRun.id == run_b, models.MatchRun.user_id == uid).first()
    if not run_a_obj or not run_b_obj:
        logger.warning("match_compare_run_not_found run_a=%s run_b=%s user_id=%s", run_a, run_b, uid)
        raise HTTPException(status_code=404, detail="Match run not found")

    res_a = {r.scholarship_id: r for r in db.query(models.MatchResult).filter(models.MatchResult.run_id == run_a).all()}
    res_b = {r.scholarship_id: r for r in db.query(models.MatchResult).filter(models.MatchResult.run_id == run_b).all()}

    all_scholarship_ids = set(res_a.keys()) | set(res_b.keys())
    scholarships = {s.id: s for s in db.query(models.Scholarship).filter(models.Scholarship.id.in_(all_scholarship_ids)).all()}

    items = []
    for sid in all_scholarship_ids:
        s = scholarships.get(sid)
        if not s:
            continue
        ra = res_a.get(sid)
        rb = res_b.get(sid)
        score_a = (ra.final_score if ra and ra.final_score is not None else ra.score) if ra else None
        score_b = (rb.final_score if rb and rb.final_score is not None else rb.score) if rb else None
        score_diff = None
        if score_a is not None and score_b is not None:
            score_diff = score_b - score_a
        items.append(schemas.MatchComparisonItem(
            scholarship_id=sid,
            title=s.title,
            provider=s.provider,
            score_a=score_a,
            score_b=score_b,
            score_diff=score_diff,
        ))

    items.sort(key=lambda x: (abs(x.score_diff or 0), -(x.score_b or x.score_a or 0)), reverse=True)

    count_a = len(res_a)
    count_b = len(res_b)
    return schemas.MatchComparisonResponse(
        run_a=schemas.MatchRunSummary(id=run_a_obj.id, profile_id=run_a_obj.profile_id, created_at=run_a_obj.created_at, result_count=count_a),
        run_b=schemas.MatchRunSummary(id=run_b_obj.id, profile_id=run_b_obj.profile_id, created_at=run_b_obj.created_at, result_count=count_b),
        items=items,
    )


@router.get("/match-runs", response_model=list[schemas.MatchRunSummary])
def list_match_runs(
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """List user's past match runs. Requires auth."""
    uid = _require_user_id(user_id)

    runs = db.query(models.MatchRun).filter(models.MatchRun.user_id == uid).order_by(models.MatchRun.created_at.desc()).all()
    out = []
    for r in runs:
        count = db.query(models.MatchResult).filter(models.MatchResult.run_id == r.id).count()
        out.append(schemas.MatchRunSummary(id=r.id, profile_id=r.profile_id, created_at=r.created_at, result_count=count))
    return out


@router.get("/match-runs/{run_id}", response_model=schemas.MatchRunDetail)
def get_match_run(
    run_id: int,
    db: Session = Depends(get_db),
    user_id: Annotated[int | None, Depends(get_current_user_id)] = None,
):
    """Get full results for a specific run. Requires auth and ownership."""
    uid = _require_user_id(user_id)

    run = db.query(models.MatchRun).filter(models.MatchRun.id == run_id).first()
    if not run or run.user_id != uid:
        logger.warning("match_run_get_not_found run_id=%s user_id=%s", run_id, uid)
        raise HTTPException(status_code=404, detail="Match run not found")

    results = db.query(models.MatchResult).filter(models.MatchResult.run_id == run_id).order_by(models.MatchResult.score.desc()).all()
    scholarship_ids = [r.scholarship_id for r in results]
    scholarships = {s.id: s for s in db.query(models.Scholarship).filter(models.Scholarship.id.in_(scholarship_ids)).all()}

    match_responses = []
    for r in results:
        s = scholarships.get(r.scholarship_id)
        if s:
            match_responses.append(_result_to_match_response(r, s))

    return schemas.MatchRunDetail(id=run.id, profile_id=run.profile_id, created_at=run.created_at, results=match_responses)
