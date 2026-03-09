from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import auth_routes, matches, profiles, scholarships
from app.config import settings
from app.db import engine, Base
from app.limiter import limiter
from app import models

if settings.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment="production" if not settings.auth_disabled else "development",
    )

app = FastAPI(title="Scholarship Matcher (Phase 1.5)")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware - origins from environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(scholarships.router, prefix="/api/v1")
app.include_router(matches.router, prefix="/api/v1")

@app.on_event("startup")
def run_migrations():
    """Ensure database schema is up to date. Run `alembic upgrade head` for migrations."""
    try:
        from alembic import command
        from alembic.config import Config
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
    except Exception:
        Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}