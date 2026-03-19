# ISKONNECT Engineering Handbook

A complete guide for understanding, navigating, and maintaining the Philippine scholarship matching platform. Written for beginner backend engineers.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Structure](#2-repository-structure)
3. [Navigation Guide](#3-navigation-guide)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Architecture](#5-database-architecture)
6. [PostgreSQL + Supabase Setup](#6-postgresql--supabase-setup)
7. [API Design](#7-api-design)
8. [Matching Algorithm](#8-matching-algorithm)
9. [Data Models](#9-data-models)
10. [Request Lifecycle](#10-request-lifecycle)
11. [Development Workflow](#11-development-workflow)
12. [Git Workflow](#12-git-workflow)
13. [Running the System Locally](#13-running-the-system-locally)
14. [Debugging Guide](#14-debugging-guide)
15. [Environment Setup](#15-environment-setup)
16. [Data Flow Diagrams](#16-data-flow-diagrams)
17. [Concepts Guide](#17-concepts-guide)
18. [Known Bugs](#18-known-bugs)
19. [Future Improvements](#19-future-improvements)
20. [Common Frontend-Backend Failures](#20-common-frontend-backend-failures)
21. [API Contract Rules](#21-api-contract-rules)
22. [Debugging Checklist](#22-debugging-checklist)
23. [Autocomplete System Lessons](#23-autocomplete-system-lessons)

---

## 1. System Overview

ISKONNECT is a scholarship matching platform. Students submit a profile; the system returns ranked scholarship matches based on eligibility (hard filters) and fit (weighted scoring).

### The Restaurant Analogy

| Restaurant Part | Your System | What It Does |
|-----------------|------------|--------------|
| **Menu** | Frontend (React) | What the user sees. Student fills a 5-step profile form and sees scholarship cards. |
| **Kitchen** | Backend (FastAPI) | Where the work happens. Receives profile, runs matching, returns results. |
| **Waiter** | API (REST) | Carries requests between browser and server. Speaks HTTP/JSON. |
| **Recipe** | Scoring Engine | Turns profile + scholarships into ranked matches. |
| **Pantry** | Database (SQLite/PostgreSQL) | Stores profiles and scholarships. SQLite for dev; PostgreSQL for production. |

### Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Database**: SQLite (dev) or PostgreSQL (production/Supabase)
- **Migrations**: Alembic

---

## 2. Repository Structure

### Complete Directory Tree

```
scholarship-match/
├── .env                    # Local env vars (DATABASE_URL, CORS_ORIGINS, etc.) — gitignored
├── .env.example            # Template for env vars
├── .gitignore
├── .github/workflows/
│   └── ci.yml              # GitHub Actions: pytest on push/PR to main
├── .vscode/
│   └── settings.json      # Python interpreter path for this workspace
├── alembic/
│   ├── env.py             # Alembic env; uses app.config for DATABASE_URL
│   ├── script.py.mako     # Migration template
│   └── versions/
│       ├── 001_initial_schema.py           # students, scholarships tables
│       ├── 002_add_users_and_profile_ownership.py
│       ├── 003_add_preferred_courses.py
│       └── 004_add_scholarship_source.py
├── app/
│   ├── main.py            # FastAPI entry point; CORS; migrations on startup
│   ├── config.py          # Settings from env (pydantic-settings)
│   ├── db.py              # SQLAlchemy engine, session, get_db
│   ├── models.py          # User, Student, Scholarship ORM models
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── auth.py            # JWT create/verify; get_current_user_id
│   ├── limiter.py         # slowapi rate limiter
│   ├── api/v1/
│   │   ├── auth_routes.py # POST /auth/register, /auth/login
│   │   ├── profiles.py    # GET/POST /profiles; get_profile_dict
│   │   ├── scholarships.py# GET/POST/PUT/DELETE /scholarships; 5-min cache
│   │   ├── matches.py     # GET /matches/{profile_id} — core matching endpoint
│   │   └── scoring.py     # Re-exports score_scholarship
│   ├── matching/
│   │   ├── match_service.py   # Orchestrates filter → score → rank
│   │   ├── hard_filters.py    # 7 deal-breaker filters
│   │   ├── scoring_port.py    # ScoringEnginePort interface
│   │   ├── legacy_scorer.py   # Legacy rule-based scorer
│   │   └── rules.py           # Legacy score_scholarship
│   ├── scoring/
│   │   ├── engine.py      # WeightedDeterministicScorer
│   │   ├── components.py # Per-component score functions
│   │   ├── config.py      # Weights, equity multipliers
│   │   └── explanation.py # Build breakdown and explanation
│   ├── taxonomy/
│   │   ├── regions.py     # Region normalization
│   │   ├── psced_fields.py# Field-of-study hierarchy
│   │   ├── income_brackets.py
│   │   ├── gwa_normalizer.py
│   │   └── equity_groups.py
│   ├── documents/
│   │   └── readiness.py   # Document readiness vs requirements
│   ├── scripts/
│   │   └── import_scholarships.py  # CSV import CLI
│   └── tests/
│       ├── test_match_service_integration.py
│       ├── test_matching.py
│       └── test_scoring_engine.py
├── frontend/
│   ├── .env               # VITE_API_BASE_URL (gitignored)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx       # React entry; Sentry init
│       ├── App.tsx        # Router; ProfilePage; handleSubmitProfile
│       ├── types.ts       # StudentProfile, MatchResult, etc.
│       ├── components/
│       │   ├── ProfileForm.tsx    # 5-step wizard
│       │   ├── ScholarshipCard.tsx
│       │   ├── MatchResults.tsx
│       │   ├── ScholarshipList.tsx
│       │   ├── Navbar.tsx
│       │   ├── Footer.tsx
│       │   ├── HeroSection.tsx
│       │   ├── NeedsCategoryAccordion.tsx
│       │   └── SelectedChips.tsx
│       ├── pages/
│       │   ├── MatchResultsPage.tsx  # Fetches matches by profileId
│       │   ├── ScholarshipDetailPage.tsx
│       │   ├── AdminPage.tsx
│       │   ├── AboutPage.tsx
│       │   ├── SettingsPage.tsx
│       │   └── ...
│       ├── constants/
│       │   ├── regions.ts
│       │   └── needsCategories.ts
│       └── contexts/
│           └── ThemeContext.tsx
├── seed_data.py           # Seeds 22 sample scholarships; run after migrations
├── start.py               # Launches uvicorn
├── start-backend.bat      # Windows: run backend
├── free_port.py           # Utility to free a port (Windows)
├── requirements.txt
├── runtime.txt            # python-3.11.9
├── alembic.ini
├── render.yaml            # Render.com deploy config
├── railway.json           # Railway deploy config
├── dev.db                 # SQLite DB (created at runtime; gitignored)
├── venv/                  # Python virtual env (gitignored)
└── README.md
```

### Purpose of Every Important File

| File | Purpose | When It Runs | Dependencies |
|------|---------|--------------|--------------|
| `app/main.py` | FastAPI app entry point; CORS; migrations on startup | On uvicorn start | config, db, models, routers |
| `app/config.py` | Load DATABASE_URL, CORS_ORIGINS, SECRET_KEY, AUTH_DISABLED from .env | At import | pydantic-settings |
| `app/db.py` | SQLAlchemy engine, SessionLocal, Base, get_db | At import; get_db per request | config |
| `app/models.py` | User, Student, Scholarship ORM models | At import | db |
| `app/schemas.py` | Pydantic StudentProfile, MatchResponse, etc. | At request validation | — |
| `app/api/v1/matches.py` | GET /matches/{profile_id} — loads profile, scholarships, runs MatchService | Per match request | profiles, scholarships, match_service |
| `app/api/v1/profiles.py` | POST /profiles, get_profile_dict | Per profile request | models, schemas, db |
| `app/api/v1/scholarships.py` | CRUD scholarships; get_cached_scholarship_dicts | Per scholarship request | models, db |
| `app/matching/match_service.py` | filter_scholarships → score → sort | Called by matches.py | hard_filters, scoring |
| `app/matching/hard_filters.py` | filter_scholarships — 7 hard filters | Called by match_service | taxonomy |
| `app/scoring/engine.py` | WeightedDeterministicScorer | Called by match_service | components, config |
| `seed_data.py` | Insert 22 scholarships | Run manually: `python seed_data.py` | db, models, alembic |
| `frontend/src/App.tsx` | Router; ProfilePage with handleSubmitProfile | On every page | ProfileForm, MatchResultsPage |
| `frontend/src/pages/MatchResultsPage.tsx` | Fetch GET /matches/{profileId}; render ScholarshipCard | When /match/:profileId | ScholarshipCard |

---

## 3. Navigation Guide

### Which Files Matter Most

**Entry points:**
- `app/main.py` — backend
- `frontend/src/main.tsx` — frontend
- `frontend/src/App.tsx` — routing and profile submit

**API definitions:**
- `app/api/v1/profiles.py` — profile CRUD
- `app/api/v1/scholarships.py` — scholarship CRUD
- `app/api/v1/matches.py` — **Get Matches** endpoint

**Database models:**
- `app/models.py` — User, Student, Scholarship

**Business logic:**
- `app/matching/match_service.py` — matching orchestration
- `app/matching/hard_filters.py` — eligibility filters
- `app/scoring/engine.py` — scoring

### Normal Workflow for Exploring

1. Start at `app/main.py` to see how the app is wired.
2. Follow a request: e.g. `GET /matches/5` → `matches.py` → `get_matches` → `MatchService.get_matches` → `hard_filters.filter_scholarships` → `scoring.engine.score`.
3. For data shape: `models.py` (DB) and `schemas.py` (API).
4. For frontend: `App.tsx` → `ProfilePage` / `MatchResultsPage` → `ProfileForm` / `ScholarshipCard`.

---

## 4. Backend Architecture

FastAPI app with versioned API (`/api/v1`). Routers: auth, profiles, scholarships, matches. Each route uses `Depends(get_db)` for a DB session. Migrations run on startup via Alembic.

---

## 5. Database Architecture

### SQLite (Development)

- **Connection**: `DATABASE_URL=sqlite:///./dev.db` in `.env`
- **File**: `dev.db` in project root (created on first run)
- **Behavior**: Single file; no separate server; `check_same_thread=False` in `db.py`

### PostgreSQL (Production)

- **Connection**: `DATABASE_URL=postgresql://user:pass@host:5432/dbname`
- **Driver**: `psycopg2-binary` (in requirements.txt)
- **Behavior**: Client-server; connection pooling; no `check_same_thread`

### How SQLAlchemy Connects

`app/db.py`:

```python
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

`app/config.py` loads `DATABASE_URL` from `.env` via pydantic-settings.

### Models → Tables

| Model | Table |
|-------|-------|
| User | users |
| Student | students |
| Scholarship | scholarships |

---

## 6. PostgreSQL + Supabase Setup

### Supabase Integration

Supabase provides PostgreSQL. Use the connection string from the Supabase dashboard:

1. Project Settings → Database → Connection string (URI)
2. Set in `.env`: `DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Running SQL Queries

**Option 1: Supabase SQL Editor**
- Dashboard → SQL Editor → New query
- Run: `SELECT * FROM scholarships;`

**Option 2: psql CLI**
```bash
psql "postgresql://user:pass@host:5432/dbname"
SELECT * FROM scholarships;
```

**Option 3: Python script**
```python
from app.db import SessionLocal
from app import models
db = SessionLocal()
count = db.query(models.Scholarship).count()
print(count)
db.close()
```

### Checking if Database Has Data

```bash
cd c:\Projects\scholarship-match
python -c "from app.db import SessionLocal; from app import models; db = SessionLocal(); print('Scholarships:', db.query(models.Scholarship).count()); db.close()"
```

If count is 0, run `python seed_data.py`.

---

## 7. API Design

### Endpoints

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | /health | health | No |
| POST | /api/v1/auth/register | register | No |
| POST | /api/v1/auth/login | login | No |
| GET | /api/v1/profiles | list_profiles | Optional |
| POST | /api/v1/profiles | create_profile | Optional* |
| GET | /api/v1/profiles/{id} | get_profile | Optional |
| GET | /api/v1/scholarships | list_scholarships | No |
| POST | /api/v1/scholarships | create_scholarship | Optional* |
| GET | /api/v1/scholarships/{id} | get_scholarship | No |
| PUT | /api/v1/scholarships/{id} | update_scholarship | Optional* |
| DELETE | /api/v1/scholarships/{id} | delete_scholarship | Optional* |
| GET | /api/v1/matches/{profile_id} | get_matches | Optional* |

*Required when `AUTH_DISABLED=false`; bypassed when `AUTH_DISABLED=true` (default).

---

## 8. Matching Algorithm

### Pipeline

1. Load profile (dict) and all active scholarships (dicts)
2. **Hard filters** — exclude scholarships that fail any filter
3. **Scoring** — for each survivor, build ScoringPayload, call WeightedDeterministicScorer
4. **Sort** by final_score descending
5. Return ranked list

### Hard Filters (Deal-Breakers)

All must pass. Fail one → scholarship excluded.

| Filter | Logic | Location |
|--------|-------|----------|
| Age | profile age within [min_age, max_age] | `_age_matches` |
| Education level | profile level in eligible_levels (with mapping) | `_level_matches` |
| Region | profile region/city in eligible_regions/cities or nationwide | `_region_matches` |
| School type | profile school_type in eligible_school_types | `_school_type_matches` |
| Income | profile income ≤ max_income_threshold | `_income_matches` |
| GWA | profile gwa_normalized ≥ min_gwa_normalized | `_gwa_matches` |
| Field | profile field matches eligible_courses_psced/specific | `_field_matches` |

### Scoring (0–100)

Weights (from `app/scoring/config.py`):
- Academic: 30%
- Income: 28%
- Field: 22%
- Geographic: 10%
- Equity: 10%

Equity multiplier: up to 1.15x for priority groups (PWD, IP, 4Ps, etc.).

### Why It May Return Zero Results

1. **Empty database** — No scholarships. Fix: `python seed_data.py`
2. **All filtered out** — Profile fails one or more hard filters for every scholarship. Check age, level, region, income, GWA, field.
3. **Schema mismatch** — If migrated to PostgreSQL, ensure migrations ran and seed was re-run.

---

## 9. Data Models

### Student (students table)

Identity: id, user_id, full_name, email  
Hard filters: education_level, current_academic_stage, region, province, city_municipality, school_type  
Scoring: gwa_raw, gwa_normalized, field_of_study_broad, preferred_courses, extracurriculars, awards  
Equity: household_income_annual, income_bracket, is_pwd, is_indigenous_people, is_4ps_listahanan, etc.

### Scholarship (scholarships table)

Core: title, provider, link, description  
Hard filters: eligible_levels, eligible_regions, eligible_cities, max_income_threshold, min_gwa_normalized, min_age, max_age, eligible_courses_psced  
Scoring: priority_groups, preferred_extracurriculars  
Benefits: benefit_tuition, benefit_allowance_monthly, benefit_total_value  
Metadata: is_active, application_deadline

---

## 10. Request Lifecycle

### User Clicks "Get Matches"

1. **Frontend** — `ProfileForm` onSubmit → `handleSubmitProfile` in App.tsx
2. **FormData → JSON** — Build StudentProfile, `JSON.stringify(profile)`
3. **POST /api/v1/profiles** — fetch() sends to backend
4. **Backend** — FastAPI → create_profile → save to DB → return `{ id: 123 }`
5. **Navigate** — `navigate(\`/match/${created.id}\`)`
6. **MatchResultsPage** — useEffect fetches `GET /api/v1/matches/123`
7. **Backend** — get_matches → get_profile_dict → get_cached_scholarship_dicts → MatchService.get_matches
8. **MatchService** — filter_scholarships → for each: build payload → score → sort
9. **Response** — `{ matches: [...] }`
10. **Frontend** — setMatches(data.matches) → render ScholarshipCard for each

---

## 11. Development Workflow

### Where to Run Commands

**All commands below: open a terminal. Default directory = project root `c:\Projects\scholarship-match` unless noted.**

| Task | Directory | Command |
|------|-----------|---------|
| Git | Project root | `git status`, `git pull`, `git commit`, `git push` |
| Backend | Project root | `python -m uvicorn app.main:app --reload --port 8000` |
| Database migrations | Project root | `alembic upgrade head` |
| Seed database | Project root | `python seed_data.py` |
| Frontend | `frontend/` | `npm install`, `npm run dev` |
| Tests | Project root | `python -m pytest app/tests/ -v` |

---

## 12. Git Workflow

| Command | What It Does |
|---------|--------------|
| `git status` | Show modified, staged, untracked files |
| `git pull` | Fetch and merge from remote |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Commit staged changes |
| `git push` | Push to remote |

---

## 13. Running the System Locally

### One-Time Setup

```powershell
cd c:\Projects\scholarship-match
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python seed_data.py

cd frontend
npm install
```

### Start Backend

```powershell
cd c:\Projects\scholarship-match
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

Backend: http://localhost:8000

### Start Frontend

```powershell
cd c:\Projects\scholarship-match\frontend
npm run dev
```

Frontend: http://localhost:5173

### Quick Test

1. Open http://localhost:5173
2. Fill profile form, click "Get My Matches"
3. You should see ranked scholarship cards

---

## 14. Debugging Guide

For a step-by-step checklist when frontend requests fail, see [Section 22: Debugging Checklist](#22-debugging-checklist).

### Symptom → Diagnosis

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "Get Matches" returns empty | **Empty database** | Run `python seed_data.py` |
| "Get Matches" returns empty | All scholarships filtered out | Check profile: age, level, region, income, GWA, field. Add logging to hard_filters. |
| "Failed to fetch" | Backend not running or wrong URL | Start uvicorn; check VITE_API_BASE_URL |
| CORS error | Origin not in CORS_ORIGINS | Add frontend URL to .env CORS_ORIGINS |
| "Profile not found" | Profile ID invalid | Check POST /profiles succeeded; log created.id |
| Python 3.14 not found | Wrong interpreter | Select venv: `.vscode/settings.json` or Ctrl+Shift+P → Python: Select Interpreter |
| Scholarships list empty | DB not seeded | `python seed_data.py` |

### Database Empty Check

```powershell
cd c:\Projects\scholarship-match
python -c "from app.db import SessionLocal; from app import models; db = SessionLocal(); print('Scholarships:', db.query(models.Scholarship).count()); db.close()"
```

### Match Pipeline Debug Logging

To see scholarship counts at each stage (filter input, after hard filters, scored results), set logging level to DEBUG:

```python
import logging
logging.getLogger("app.matching.match_service").setLevel(logging.DEBUG)
```

Or set `LOG_LEVEL=DEBUG` if your app reads it. Logs appear as:
- `match_service: filter input scholarships=N`
- `match_service: after hard filters candidates=N`
- `match_service: scored results=N`

---

## 15. Environment Setup

### Root `.env`

```
DATABASE_URL=sqlite:///./dev.db
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
SECRET_KEY=change-me-in-production-use-openssl-rand-hex-32
AUTH_DISABLED=true
```

### Frontend `frontend/.env`

```
VITE_API_BASE_URL=http://localhost:8000
```

### Python Interpreter

If you see "did not find executable at C:\Program Files\Python314\python.exe":

1. Ctrl+Shift+P → "Python: Select Interpreter"
2. Choose `.\venv\Scripts\python.exe` or `.\venv\Scripts\python.exe`

Or ensure `.vscode/settings.json` has:
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/Scripts/python.exe"
}
```

---

## 16. Data Flow Diagrams

### Architecture

```mermaid
flowchart TB
  subgraph frontend [Frontend]
    ProfileForm[ProfileForm]
    AppTsx[App.tsx]
    MatchPage[MatchResultsPage]
    ScholarshipCard[ScholarshipCard]
  end

  subgraph backend [Backend]
    ProfilesAPI[profiles.py]
    MatchesAPI[matches.py]
    MatchSvc[MatchService]
    HardFilters[hard_filters]
    ScoringEng[scoring/engine]
  end

  subgraph db [Database]
    Students[students]
    Scholarships[scholarships]
  end

  ProfileForm --> AppTsx
  AppTsx -->|POST /profiles| ProfilesAPI
  ProfilesAPI --> Students
  AppTsx -->|navigate| MatchPage
  MatchPage -->|GET /matches/ID| MatchesAPI
  MatchesAPI --> Students
  MatchesAPI --> Scholarships
  MatchesAPI --> MatchSvc
  MatchSvc --> HardFilters
  MatchSvc --> ScoringEng
  MatchesAPI --> MatchPage
  MatchPage --> ScholarshipCard
```

### Matching Pipeline

```mermaid
flowchart LR
  AllScholarships[All scholarships] --> HardFilters[Hard Filters]
  HardFilters --> Candidates[Candidates]
  Candidates --> Score[Score each]
  Score --> Sort[Sort by score]
  Sort --> Response[Return ranked]
```

---

## 17. Concepts Guide

| Concept | What It Is | Why This Project Uses It |
|---------|------------|---------------------------|
| **FastAPI** | Python web framework | HTTP routing, validation, OpenAPI docs |
| **SQLAlchemy** | Python ORM | Map Python objects to DB tables |
| **Pydantic** | Data validation | Validate request/response shapes |
| **REST** | API design style | GET/POST/PUT/DELETE on resources |
| **PostgreSQL** | Relational database | Production DB; Supabase |
| **Supabase** | Hosted PostgreSQL | Managed DB for production |
| **Environment variables** | Config outside code | DATABASE_URL, CORS_ORIGINS, etc. |
| **Dependency injection** | Framework provides deps | get_db yields session to routes |
| **Database session** | Connection to DB | One per request; closed after |
| **ORM models** | Python classes = tables | Student, Scholarship in models.py |
| **HTTP request** | Client asks server | fetch() from frontend |
| **JSON serialization** | Dict → string for wire | JSON.stringify, FastAPI auto-serialize |
| **Hard filter** | Pass/fail; fail = exclude | Eligibility rules |
| **Soft scoring** | 0–100 continuous | Ranking by fit |
| **Alembic** | Migration tool | Versioned schema changes |
| **JWT** | Stateless auth token | When AUTH_DISABLED=false |
| **CORS** | Browser cross-origin rule | Allow frontend to call backend |
| **React** | UI library | Components, state, routing |
| **Vite** | Build tool | Dev server, bundle for prod |
| **Tailwind** | Utility CSS | Styling via classes |

---

## 18. Known Bugs

| Bug | Status | Notes |
|-----|--------|-------|
| Empty matches when DB has no data | **Fixed** | Run `python seed_data.py` |
| Python 3.14 interpreter error | **Fixed** | `.vscode/settings.json` points to venv |
| CORS if frontend URL not in list | Mitigated | Add to CORS_ORIGINS |
| Race condition on create_profile (same email) | Known | IntegrityError fallback to update |

---

## 19. Future Improvements

- Pagination for match results when count is large
- React error boundaries for frontend crashes
- Frontend tests (Vitest, React Testing Library)
- Match result caching per profile (short TTL)
- Debounce on search/filter inputs
- Connection pooling config for PostgreSQL at scale

---

## 20. Common Frontend-Backend Failures

### Registration "Failed to Fetch" (March 2025)

| Item | Detail |
|------|--------|
| **Root cause** | bcrypt 5.0.0 / passlib 1.7.4 incompatibility. `hash_password()` threw `ValueError` during backend init of bcrypt backend. Unhandled exception → 500 Internal Server Error. ServerErrorMiddleware handled 500 *above* CORSMiddleware, so response had no CORS headers. Browser blocked the response → `TypeError: Failed to fetch`. |
| **Symptoms** | Registration form shows "Failed to fetch"; health endpoint returns 200; register endpoint returns 500 with no CORS headers. |
| **Fix applied** | Replaced passlib with direct bcrypt calls in `app/auth.py` (`hash_password`, `verify_password`). Updated `requirements.txt`: `passlib[bcrypt]==1.7.4` → `bcrypt==5.0.0`. |
| **Prevention** | Pin transitive dependencies explicitly in `requirements.txt`. Avoid unmaintained libraries (passlib); prefer direct bcrypt when possible. |

---

## 21. API Contract Rules

- **Never change request/response without compatibility** — Add new fields additively; avoid removing or renaming fields. Use optional fields for new data.
- **Always validate frontend/backend sync** — After schema changes, verify frontend payload matches backend Pydantic models. Run both locally and test the affected flow.
- **Version the API** — Use `/api/v1/` prefix; introduce v2 for breaking changes instead of modifying v1 in place.

---

## 22. Debugging Checklist

When a frontend request fails (e.g. "Failed to fetch", CORS error, 4xx/5xx):

| Step | Check | Command / Action |
|------|-------|-------------------|
| 1 | Backend running | `curl http://localhost:8000/health` or `Invoke-WebRequest http://localhost:8000/health` |
| 2 | Endpoint URL correct | Verify `VITE_API_BASE_URL` in `frontend/.env`; frontend must call `{base}/api/v1/...` |
| 3 | CORS | Ensure frontend origin (e.g. `http://localhost:5173`) is in `CORS_ORIGINS` in `.env` |
| 4 | Schema alignment | Compare frontend request body with backend Pydantic schema; check for missing/extra fields |
| 5 | Backend logs | Check uvicorn console for 500 tracebacks; unhandled exceptions often cause generic 500 with no CORS headers |

---

## 23. Autocomplete System Lessons

Lessons learned from building and fixing the autocomplete fields (school, province, preferred courses) and the region toggle selector.

---

### 23.1 Autocomplete Architecture

**The loop:** User types → frontend debounces → API request → backend returns suggestions → UI shows dropdown.

```
User types "UP" → (300ms debounce) → GET /api/v1/suggestions/schools?q=UP
→ Backend searches DB → Returns ["University of the Philippines Diliman", ...]
→ Frontend setSuggestions(results) → Dropdown renders
```

**Why debouncing matters:** Without it, every keystroke would trigger an API call. Typing "University" (10 letters) = 10 requests. Debounce waits until the user pauses (e.g. 300ms); only then do we fetch. Fewer requests, less server load, better UX.

**Async fetch flow:** The component uses `useEffect` + `useCallback`. When `debouncedQuery` changes, the effect runs, calls `fetchSuggestions()`, and updates `suggestions` state. React re-renders with the new list.

---

### 23.2 State Management Bug: inputValue vs selectedValue

**The problem:** Many autocomplete bugs come from mixing two different concepts:

| Concept | What it is | Example |
|---------|------------|---------|
| **inputValue** | What the user is typing (search query) | "UP" |
| **selectedValue** | The final chosen item from the list | "University of the Philippines Diliman" |

**Why mixing them causes bugs:** If you use a single `value` for both, React cannot tell the difference between:
- User typing "University of the Philippines Diliman" (searching)
- User clicking that suggestion (confirmed selection)

When the user selects, you call `onChange(name, "University of the Philippines Diliman")`. The parent updates state. The debounce sees the new value and thinks "user typed something new" → fetches again → dropdown reopens. The selection appears to "disappear."

**Source of truth:** One piece of state should own each piece of data. If `value` is the source of truth for what's displayed, then selection and typing both write to it. The fix: add an out-of-band signal (e.g. `justSelectedRef`) so the effect knows "this change was a selection, skip the fetch."

---

### 23.3 Controlled Components in React

**What they are:** A controlled input's value comes from React state, not from the DOM. You pass `value={state}` and `onChange` updates that state.

```tsx
<input value={values.school} onChange={(e) => handleChange("school", e.target.value)} />
```

**Why React state must control UI:** React's model is "state drives UI." If the input value lives in state, React can:
- Re-render with the correct value when state changes
- Validate and transform input
- Sync with other parts of the app (e.g. form submission)

**Uncontrolled** inputs use `defaultValue` and read from the DOM via refs. We use controlled inputs in our forms so the parent (`ProfileForm`) owns the data and can validate, persist drafts, and submit.

---

### 23.4 Memoization

**What it is (simple terms):** Storing the result of a computation so you don't repeat it. Like a cache: "I already computed this; here's the answer."

**In React:**
- `useCallback(fn, deps)` — returns the same function reference until deps change. Avoids recreating the function every render.
- `useMemo(() => compute(), deps)` — returns the same computed value until deps change.

**Why it matters for autocomplete:** If `fetchSuggestions` is recreated every render (e.g. because `extraParams` is a new object `{}` each time), then `useEffect` depends on it and runs every render → infinite fetch loop. Fix: use `useRef` for `extraParams` so `fetchSuggestions` stays stable; only `endpoint` (a string) is in the dependency array.

**Connection to debounce:** Debounce is a form of memoization — we "remember" the latest input and only act after a delay. Caching API results (e.g. "don't fetch 'UP' again if we already have results") is another.

**Data Structures connection:** Caches are often implemented with hash maps (O(1) lookup). Memoization trades memory (storing results) for speed (avoiding recomputation).

---

### 23.5 UX Design: Autocomplete vs Toggle List

| Use case | Component | When |
|----------|-----------|------|
| **Autocomplete** | Type to search, API returns suggestions | Large datasets (schools, courses, provinces). User may not know exact name. |
| **Toggle / Select** | Click to open, pick from fixed list | Small fixed sets (17 regions, gender, education level). No search needed. |

**Region field:** 17 options, never change at runtime. Autocomplete added API calls, debounce delay, and allowed invalid entries ("Metro Manila"). A static `<select>` is instant, prevents invalid input, and matches other dropdowns (education_level, school_type).

**Why this matters:** Match the UI to the data. Don't add complexity (API, debounce) when a simple dropdown is faster and safer.

---

### 23.6 Debugging Workflow: Frontend → Backend

When autocomplete or API calls misbehave:

| Step | Action |
|------|--------|
| 1. **Trace frontend → backend** | Find where the request is made (e.g. `AutocompleteInput` → `apiFetch`). Check what URL and params are sent. |
| 2. **Check Network tab** | DevTools → Network. Filter by Fetch/XHR. See request URL, status, response body. Confirm the backend received what you expect. |
| 3. **Isolate backend** | Call the endpoint directly (e.g. `curl "http://localhost:8000/api/v1/suggestions/schools?q=UP"`). If it works, the bug is frontend (params, parsing, state). |
| 4. **Validate response format** | Ensure the backend returns the shape the frontend expects (e.g. `{ suggestions: string[] }`). Mismatch → parsing errors or empty UI. |

**Common causes:** Wrong URL, missing query param, CORS, 429 rate limit, unstable `useEffect` deps causing infinite loops.

---

*Handbook last updated: March 2025*