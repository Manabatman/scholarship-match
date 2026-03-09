"""
JWT authentication for protected endpoints.
Set AUTH_DISABLED=true for local development to bypass auth.
"""
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub = payload.get("sub")
        return int(sub) if sub else None
    except (JWTError, ValueError):
        return None


def _get_user_id_from_token(
    credentials: HTTPAuthorizationCredentials | None,
    db: Session,
) -> int | None:
    if not credentials:
        return None
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        return None
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user_id if user else None


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Session = Depends(get_db),
) -> int | None:
    """
    Dependency: return user_id if authenticated.
    When AUTH_DISABLED=true, returns None (endpoints allow unauthenticated access).
    When AUTH_DISABLED=false, raises 401 if no valid token.
    """
    if settings.auth_disabled:
        return _get_user_id_from_token(credentials, db) if credentials else None
    user_id = _get_user_id_from_token(credentials, db)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


def require_profile_owner(
    profile_id: int,
    user_id: int,
    db: Session,
) -> None:
    """Raise 403 if profile does not belong to user."""
    profile = db.query(models.Student).filter(models.Student.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id is not None and profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
