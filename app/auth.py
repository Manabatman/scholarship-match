"""
JWT authentication for protected endpoints.
Set AUTH_DISABLED=true for local development to bypass auth.
"""
from datetime import datetime, timedelta
from typing import Annotated

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app import models

security = HTTPBearer(auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(user_id: int, role: str = "student") -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
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


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Session = Depends(get_db),
) -> models.User | None:
    """
    Dependency: return full User object if authenticated.
    Returns None when no valid token. Respects AUTH_DISABLED for optional auth.
    """
    if not credentials:
        return None
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        return None
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user


def require_admin(
    user: Annotated[models.User | None, Depends(get_current_user)],
) -> models.User | None:
    """
    Dependency: require admin role for protected endpoints.
    When AUTH_DISABLED=true, bypasses check (returns None, allows request).
    When AUTH_DISABLED=false, raises 401 if not authenticated, 403 if not admin.
    """
    if settings.auth_disabled:
        return None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    role = getattr(user, "role", "student")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return user


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
