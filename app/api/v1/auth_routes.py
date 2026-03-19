"""Auth endpoints: register and login."""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.db import get_db
from app.limiter import limiter
from app import models

router = APIRouter()
logger = logging.getLogger(__name__)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str


class UserMeResponse(BaseModel):
    id: int
    email: str
    role: str


@router.post("/auth/register", response_model=TokenResponse)
@limiter.limit("5/minute")
def register(request: Request, register_req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user. Returns JWT with user_id and role."""
    existing = db.query(models.User).filter(models.User.email == register_req.email).first()
    if existing:
        logger.warning("auth_register_failed email=%s reason=already_registered", register_req.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = models.User(
        email=register_req.email,
        password_hash=hash_password(register_req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    role = getattr(user, "role", "student")
    return TokenResponse(
        access_token=create_access_token(user.id, role=role),
        user_id=user.id,
        role=role,
    )


@router.post("/auth/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password. Returns JWT with user_id and role."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        logger.warning("auth_login_failed email=%s reason=invalid_credentials", req.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    role = getattr(user, "role", "student")
    return TokenResponse(
        access_token=create_access_token(user.id, role=role),
        user_id=user.id,
        role=role,
    )


@router.get("/auth/me", response_model=UserMeResponse)
def get_me(
    user: Annotated[models.User | None, Depends(get_current_user)],
):
    """Return current authenticated user info. Returns 401 if not authenticated."""
    if user is None:
        logger.warning("auth_me_failed reason=not_authenticated")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return UserMeResponse(id=user.id, email=user.email, role=getattr(user, "role", "student"))
