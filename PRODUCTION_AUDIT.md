# Production Engineering Audit

An analysis of 8 production engineering concepts applied to the ISKONNECT scholarship matching platform. This audit evaluates whether each concept is needed, where it would apply, and what the simplest production-safe implementation would be.

---

## Step 1 — Current System Behavior Analysis

### How API Requests Flow Through the System

**Profile creation and match fetch (primary user journey)**

```
User clicks "Get My Matches"
    → App.tsx handleSubmitProfile (line 21-111)
    → POST /api/v1/profiles (line 78)
    → profiles.py create_profile (line 126-141)
        → Query: existing = db.query(Student).filter(email=...).first()
        → If exists: update + commit
        → Else: insert + commit
    → Response: { id: 123, ... }
    → GET /api/v1/matches/123 (line 93-94)
    → matches.py get_matches (line 14-34)
        → get_profile_dict(123)
        → db.query(Scholarship).filter(is_active != False).all()  ← loads ALL scholarships every time
        → MatchService.get_matches(profile, scholarship_dicts)
        → filter_scholarships → score each → sort
    → Response: { matches: [...] }
    → setMatches(matchData.matches); setStep("results")
```

**Scholarship browse (secondary flow)**

```
User clicks "Scholarships" in nav
    → step = "scholarships"
    → ScholarshipList mounts
    → useEffect runs (line 96-118)
    → GET /api/v1/scholarships
    → scholarships.py list_scholarships (line 120-125)
        → db.query(Scholarship).filter(is_active != False).all()
        → Convert each to response dict
    → setScholarships(data)
```

### How Scholarship Data Is Fetched

| Endpoint | When | What Happens |
|----------|------|--------------|
| `GET /api/v1/scholarships` | Every time user visits "All Scholarships" | Full DB query; no cache. Same 22 rows every time. |
| `GET /api/v1/matches/{id}` | After profile creation | Loads all scholarships again, filters, scores. Scholarships are loaded twice in one user journey (once implicitly via matches, once if they browse). |

### How Profiles Are Created

In `app/api/v1/profiles.py` (lines 126-141):

```python
existing = db.query(models.Student).filter(models.Student.email == profile.email).first()
if existing:
    for k, v in data.items():
        setattr(existing, k, v)
    db.commit()
    db.refresh(existing)
    return _profile_to_response(existing)

db_profile = models.Student(**data)
db.add(db_profile)
db.commit()
```

This is a **check-then-act** pattern: read (does email exist?), then decide (update or insert). Under concurrency, two requests with the same email can both see "no existing" and both try to insert. The second hits a unique constraint violation.

### How Frontend Requests Interact with Backend

- **Profile submit**: Single POST, then single GET for matches. Sequential. No duplicate requests from the form (button disabled via `loading`).
- **Scholarship list**: Fetches on every mount. If user toggles Profile → Scholarships → Profile → Scholarships, each "Scholarships" visit triggers a new fetch.
- **No search or filter**: No text inputs that would trigger API calls on keystroke. No debounce target.

### Identified Risk Areas

| Risk | Location | Description |
|------|----------|-------------|
| **Performance: redundant DB reads** | `scholarships.py` line 121-124; `matches.py` line 20-23 | Scholarship list is static (seeded) but queried on every request. With 22 rows it's fine; with 1000+ it would hurt. |
| **Duplicate requests** | N/A | Form has `disabled={loading}`. No auto-refresh. Low risk. |
| **Data inconsistency** | `profiles.py` line 129-141 | Race condition: two concurrent POSTs with same email can both pass the `existing` check and cause IntegrityError on insert. |
| **Scalability bottleneck** | `match_service.py` line 146-155 | For each eligible scholarship, full scoring pipeline runs. O(n) per request. Fine at 22; would need caching or precomputation at scale. |
| **No abuse protection** | All endpoints | No rate limiting. A bot could flood POST /profiles or GET /matches. |

### Current Bottlenecks Summary

| Operation | Cost | At Current Scale (22 scholarships) |
|-----------|------|-----------------------------------|
| List scholarships | 1 DB query | Negligible |
| Create profile | 1 read + 1 write | Negligible |
| Get matches | 1 profile read + 1 full scholarship load + O(n) scoring | Negligible |
| Browse scholarships (frontend) | 1 fetch per mount | Redundant if user toggles views |

---

## Step 2 — Concept-by-Concept Evaluation

### 1. Caching

**What it means**: Store a computed result and reuse it instead of recomputing. Like keeping yesterday's newspaper instead of going to the store every time you want to read it.

**Why it exists**: Computation and I/O cost time. If the same data is requested repeatedly and doesn't change often, serving from memory is faster than hitting the database.

**Relevant to this project?** Yes.

**Evidence**: 
- `GET /api/v1/scholarships` returns the same 22 scholarships on every call. Data comes from `seed_data.py` and changes rarely (only when an admin adds scholarships).
- `GET /api/v1/matches/{id}` loads all scholarships from DB every time, even though the scholarship catalog is the same for every user.

**Problem it would solve**: Reduce DB load and response time. When 100 users browse scholarships in a minute, you'd do 100 identical queries instead of 1 cached result.

**Where to implement**:
- **Backend**: `app/api/v1/scholarships.py` — cache the result of `list_scholarships` with a TTL.
- **Frontend**: `ScholarshipList` could receive scholarships as a prop from `App` so they're not re-fetched when the user navigates away and back. (Simpler: lift state.)

### 2. TTL (Time-to-Live)

**What it means**: How long a cached entry is valid. After TTL seconds, the cache entry is considered stale and the next request recomputes.

**Why it exists**: Balance freshness vs performance. Too short = little benefit. Too long = users see outdated data after an admin adds a scholarship.

**Relevant to this project?** Yes, if caching is used.

**Evidence**: Scholarship data is updated rarely (manual seed or admin POST). A new scholarship might be added once per day or week.

**Problem it would solve**: Prevent serving stale scholarship list indefinitely. With a 5-minute TTL, a new scholarship appears within 5 minutes of being added.

**Suggested TTL values**:
- **Scholarship list**: 5 minutes (300 seconds). Admin adds scholarship → visible within 5 min.
- **Match results**: No cache. They're per-profile and computed; caching would need profile ID + cache invalidation when profile changes. Not worth it at current scale.
- **Scholarship details** (if you add a detail endpoint): Same as list, or longer if details change rarely.

**Where to implement**: In the cache layer (e.g., `cachetools.TTLCache(maxsize=1, ttl=300)` for the scholarship list).

### 3. Rate Limiting

**What it means**: Limit how many requests a client (IP or user) can make per time window. "You can order 10 drinks per minute; after that, wait."

**Why it exists**: Protect the server from abuse: bots, scrapers, DDoS, or buggy clients that retry too aggressively.

**Relevant to this project?** Partially. Not urgent at dev scale; important before public deployment.

**Evidence**: No authentication. Any client can call any endpoint. A script could POST 1000 profiles per second or GET /matches in a loop.

**Problem it would solve**: Prevent a single bad actor or bug from exhausting server resources. With rate limiting, excess requests get 429 Too Many Requests.

**Simplest implementation**: Middleware that tracks requests per IP per minute. Libraries like `slowapi` do this. Example: 60 requests/minute per IP for anonymous users.

**Where to implement**: `app/main.py` — add rate limit middleware before or after CORS.

### 4. Debounce

**What it means**: Delay an action until the user has stopped doing something for X milliseconds. Typing "engineering" → wait 300ms after last keystroke → then search.

**Why it exists**: Avoid firing expensive operations on every keystroke. Without debounce, typing 10 characters = 10 API calls.

**Relevant to this project?** No.

**Evidence**: 
- No search input. `ScholarshipList` shows all scholarships; no filter-by-text.
- `ProfileForm` has no live search. Form submission is button-triggered.
- Submit button uses `disabled={loading}` so double-clicks don't send duplicate requests.

**Problem it would solve**: None currently. If you add a scholarship search box, debounce that input.

**Where to implement**: N/A now. If added: wrap the search input's `onChange` in a debounced function (e.g., `lodash.debounce` or a custom hook).

### 5. Race Conditions

**What it means**: Outcome depends on the timing of concurrent operations. Two people try to grab the last seat—who gets it depends on microseconds.

**Why it exists**: Concurrency. Multiple requests can be in-flight at once. If your logic is "check then act," another request can slip between the check and the act.

**Relevant to this project?** Yes.

**Evidence**: `profiles.py` lines 129-141:

```python
existing = db.query(models.Student).filter(models.Student.email == profile.email).first()
if existing:
    # update
else:
    db_profile = models.Student(**data)
    db.add(db_profile)
    db.commit()
```

Two requests with the same email can both run `existing = ... first()` and both get `None`. Both go to the `else` branch. The first inserts successfully. The second hits `IntegrityError` (unique constraint on email) and the user sees a 500 error.

**How it would appear in production**: Under load, users occasionally get "Internal Server Error" when creating a profile, especially if they double-submit or if two devices use the same email simultaneously.

**Fix**: Use a database-level upsert or catch `IntegrityError` and retry with an update. Options:
- `INSERT ... ON CONFLICT (email) DO UPDATE` (SQLite 3.24+)
- Try insert; on IntegrityError, do update
- Use SQLAlchemy's `merge()` with proper session handling

**Where to implement**: `app/api/v1/profiles.py` in `create_profile`.

### 6. Memory Leaks

**What it means**: Memory that is allocated but never freed. Over time, the application uses more and more RAM. In React: updating state on an unmounted component.

**Why it exists**: Async operations (fetch, subscriptions) can complete after the component has unmounted. If the callback calls `setState`, React warns and you've leaked.

**Relevant to this project?** No. Current implementation is safe.

**Evidence**: `ScholarshipList.tsx` lines 96-118:

```tsx
useEffect(() => {
  let cancelled = false;
  // ...
  fetch(...)
    .then(data => {
      if (!cancelled) setScholarships(...);
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });
  return () => { cancelled = true; };  // cleanup
}, []);
```

The cleanup sets `cancelled = true`. If the user navigates away before the fetch completes, the callback does nothing. No setState on unmounted component.

`App.tsx` submit handler is event-driven (user clicks once). No subscriptions or intervals. No leak pattern.

**Where to implement**: N/A. No changes needed.

### 7. Idempotency

**What it means**: Performing the same operation multiple times has the same effect as doing it once. GET is idempotent. POST create is usually not—two identical POSTs create two resources.

**Why it exists**: Safe retries. If a request times out, the client can retry without creating duplicates.

**Relevant to this project?** Effectively already satisfied.

**Evidence**: `create_profile` upserts by email. Two identical POSTs with the same email result in one profile (the second updates the first). That's idempotent for "create or update profile for this email."

GET endpoints are inherently idempotent.

**Problem without idempotency**: User clicks "Get My Matches," request times out, user clicks again → two profiles? In this app, no—same email upserts. So no change needed.

**Where to implement**: N/A. Current design is sufficient.

### 8. Connection Pooling

**What it means**: Reuse database connections instead of opening a new one per request. A pool of N connections serves many requests.

**Why it exists**: Opening a connection is expensive. Under load, creating a new connection per request can exhaust resources or slow things down.

**Relevant to this project?** No at current scale.

**Evidence**: `app/db.py`:

```python
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

SQLAlchemy's default engine uses a connection pool (QueuePool). For SQLite, the "pool" is effectively one connection per thread because of SQLite's design. With a single-threaded dev server, you have one connection. That's fine.

**When it matters**: Migrating to PostgreSQL with multiple workers. Then you'd configure `pool_size` and `max_overflow`. For SQLite at dev scale, no action needed.

**Where to implement**: N/A. Revisit when moving to PostgreSQL.

---

## Step 3 — Classification Table

| Concept | Verdict | Rationale |
|---------|---------|-----------|
| **Caching** | Implement now | Scholarship list is static and re-fetched constantly. Simple backend cache gives immediate benefit. |
| **TTL** | Implement now | Required if caching. 5 min for scholarship list balances freshness and performance. |
| **Rate limiting** | Implement later | No auth = vulnerable to abuse. Add when deploying to production. |
| **Debounce** | Unnecessary | No search/filter inputs. Form submit is already guarded. |
| **Race conditions** | Implement now | Profile upsert has a real concurrency bug. Fix is small and high-value. |
| **Memory leaks** | Unnecessary | ScholarshipList already has proper cleanup. No leaks. |
| **Idempotency** | Unnecessary | create_profile already upserts by email. GETs are idempotent. |
| **Connection pooling** | Unnecessary | SQLite + single worker. Revisit with PostgreSQL. |

---

## Step 4 — Safe Implementation Plan

### Implement Now: Three Changes

#### 1. Backend Scholarship Cache with TTL

**File**: `app/api/v1/scholarships.py`

**What**: Cache the list of scholarships in memory with a 5-minute TTL. Invalidate when a new scholarship is created.

**Steps**:
1. Add `cachetools` to `requirements.txt` (or use `functools.lru_cache` with a custom wrapper for TTL).
2. Create a module-level cache: `from cachetools import TTLCache` and `_scholarship_cache = TTLCache(maxsize=1, ttl=300)`.
3. In `list_scholarships`, check cache first. If miss, query DB, store in cache, return.
4. In `create_scholarship`, after commit, clear the cache (e.g., `_scholarship_cache.clear()`).

**Risk**: Minimal. Cache is process-local. If you run multiple workers, each has its own cache (stale for up to 5 min on other workers—acceptable).

#### 2. Race Condition Fix in Profile Creation

**File**: `app/api/v1/profiles.py`

**What**: Make the email upsert atomic. Use try/except on IntegrityError: try insert first; if unique violation, do update.

**Steps**:
1. Swap order: try insert first.
2. On `IntegrityError` (or SQLAlchemy's `IntegrityError`), rollback, then do the existing lookup + update path.
3. Ensure the unique constraint on `email` exists in the model (it does: `unique=True` on the email column).

**Pseudocode**:
```python
try:
    db_profile = models.Student(**data)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return _profile_to_response(db_profile)
except IntegrityError:
    db.rollback()
    existing = db.query(models.Student).filter(models.Student.email == profile.email).first()
    if not existing:
        raise  # re-raise if it was a different constraint
    for k, v in data.items():
        setattr(existing, k, v)
    db.commit()
    db.refresh(existing)
    return _profile_to_response(existing)
```

**Risk**: Low. Handles the race; duplicate emails now result in update instead of 500.

#### 3. Frontend Scholarship Cache (Optional)

**File**: `frontend/src/App.tsx`, `frontend/src/components/ScholarshipList.tsx`

**What**: Lift scholarship state to App so that when the user navigates Profile → Scholarships → Profile → Scholarships, the second visit doesn't re-fetch.

**Steps**:
1. Add `scholarships` and `setScholarships` state in App (or a context).
2. Pass `scholarships` and a fetch function to ScholarshipList.
3. ScholarshipList fetches only if `scholarships.length === 0` (or add an explicit "last fetched" timestamp).
4. When step changes to "scholarships", if we have data, use it; else fetch.

**Risk**: Low. Slightly more state in App. Improves UX when toggling views.

**Note**: This is optional. The backend cache gives most of the benefit. Frontend cache reduces redundant network calls for the same user session.

### Implementation Order

1. **Race condition fix** — Highest impact, smallest change. Do first.
2. **Backend scholarship cache** — Reduces DB load. Add `cachetools` and implement.
3. **Frontend scholarship cache** — Nice-to-have. Can defer.

### What Not to Do

- Do not add Redis or any external cache. In-memory is enough for this scale.
- Do not add rate limiting until you deploy. Keep the implementation plan in mind.
- Do not add debounce. There's nothing to debounce.
- Do not change connection pooling. SQLite is fine as-is.

---

## Step 5 — Engineering Intuition

### Caching

**Symptom**: "Every request hits the database even though the data rarely changes."

**Intuition**: If you're serving the same data to many users and it doesn't change often, you're doing redundant work. Cache it.

**In this project**: Scholarship list is identical for every request. That's a caching signal.

---

### TTL

**Symptom**: "Users report seeing old data after we added something new."

**Intuition**: Caches need an expiration. Otherwise you're serving a snapshot forever. TTL is the simplest expiration: "this entry is valid for X seconds."

**In this project**: Admin adds a scholarship. Without TTL, cache could serve the old list indefinitely. With 5-min TTL, it's fresh within 5 minutes.

---

### Rate Limiting

**Symptom**: "Our API works fine, then suddenly it's slow or down. Logs show one IP making 10,000 requests per minute."

**Intuition**: When you have no auth, anyone can hit your API. Bots, scrapers, or bugs will. Rate limiting says: "Slow down. We'll serve you, but not that fast."

**In this project**: Not urgent in dev. When you deploy, add it. Symptom to watch: spikes in request volume from single IPs.

---

### Debounce

**Symptom**: "Every keystroke triggers an API call. Our search box is firing 10 requests for a 10-character query."

**Intuition**: When user input drives API calls, wait until they pause. Debounce = "wait X ms after last event, then act."

**In this project**: No search box. No debounce target. If you add one, debounce it.

---

### Race Conditions

**Symptom**: "It works when I test alone. Under load, we get random 500s or duplicate records."

**Intuition**: "Check then act" is a race. Two requests can both pass the check before either acts. Fix: make the operation atomic (single DB statement) or use locks/retries.

**In this project**: Two POSTs with same email, both see "no existing," both insert. Second fails. Fix: try insert, catch IntegrityError, then update.

---

### Memory Leaks

**Symptom**: "The app gets slower over time. Memory usage keeps growing."

**Intuition**: Something isn't being cleaned up. In React: async callbacks that run after unmount and call setState. Fix: cancel or ignore in cleanup.

**In this project**: ScholarshipList already has the `cancelled` flag. You're good. Symptom to watch: React warnings about setState on unmounted component.

---

### Idempotency

**Symptom**: "User retries a failed request and now they have two orders / two profiles."

**Intuition**: If the client can't tell whether the first request succeeded, they'll retry. Non-idempotent POSTs create duplicates. Idempotent = same request twice = same result.

**In this project**: create_profile upserts by email. Same email twice = one profile. You're already idempotent for that case.

---

### Connection Pooling

**Symptom**: "Under load, we get 'too many connections' or the DB becomes the bottleneck."

**Intuition**: Each connection costs resources. A pool reuses connections. With SQLite and one worker, you effectively have one connection. With PostgreSQL and many workers, you need a pool.

**In this project**: SQLite, single process. No pooling changes needed. Revisit when you scale.

---

## Summary

| Concept | Implement? | Action |
|---------|------------|--------|
| Caching | Yes | Backend cache for scholarship list |
| TTL | Yes | 5 min for scholarship cache |
| Rate limiting | Later | Add when deploying |
| Debounce | No | Nothing to debounce |
| Race conditions | Yes | Fix profile upsert with try/except |
| Memory leaks | No | Already safe |
| Idempotency | No | Already satisfied |
| Connection pooling | No | SQLite is fine |

Focus on the race condition fix and backend scholarship cache. Both are small, high-value changes that make the system more production-ready without overengineering.
