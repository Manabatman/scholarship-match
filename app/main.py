from fastapi import FastAPI
from app.api.v1 import matches, profiles, scholarships
from app.db import engine, Base
from app import models

app = FastAPI(title="Scholarship Matcher (Phase 1.5)")

app.include_router(profiles.router, prefix="/api/v1")
app.include_router(scholarships.router, prefix="/api/v1")
app.include_router(matches.router, prefix="/api/v1")

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}
