from fastapi import FastAPI
from app.api.v1 import profiles, matches

app = FastAPI(title="Scholarship Matcher (Phase 1)")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(matches.router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}
