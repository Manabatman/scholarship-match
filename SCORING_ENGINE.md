# Scoring Engine Documentation

## Scoring Philosophy

**What the score represents:** Eligibility Fitness — a 0–100 measure of how strongly a student's profile aligns with a specific scholarship's criteria, preferences, and priorities. It is NOT a probability, NOT a recommendation confidence, and NOT a competitiveness rank against other students.

**Why weighted scoring:** Each scholarship values different dimensions (merit vs. need vs. field priority). A weighted model lets the system express these priorities as adjustable numbers rather than hard-coded logic. This mirrors how FAFSA EFC, UK Student Finance, and Canadian grant systems work.

**Why NOT machine learning:**
- No training data exists (no historical application outcomes)
- Policy compliance requires deterministic, auditable logic
- Every score component must be explainable to the student in plain language
- CHED/LGU partners demand documented, reproducible ranking criteria
- ML introduces algorithmic bias risk unacceptable in public-benefit infrastructure

**Equity handling philosophy:** Equity groups (PWD, IP, Solo Parent, 4Ps) receive small multiplicative boosts (1.05–1.10) applied AFTER the base score. They never override hard eligibility gates and elevate ranking without dominating it.

---

## Component Breakdown

| Component | Weight | Purpose |
|-----------|--------|---------|
| Academic Strength | 30% | How well GWA meets/exceeds scholarship minimum |
| Income Alignment | 25% | Need-based fit (lower income = higher score for need scholarships) |
| Field Alignment | 20% | PSCED-aligned course/discipline match quality |
| Geographic Relevance | 10% | Location proximity for LGU and regional scholarships |
| Equity Priority | 10% | Alignment with scholarship priority groups (PWD, IP, etc.) |
| Readiness Score | 5% | Document preparation completeness |

---

## Formula Explanation

### Base Score

```
base_score = sum(component_i × weight_i) × 100
```

Each component returns a value from 0.0 to 1.0. The weighted sum is scaled to 0–100.

### Equity Multiplier

```
final_score = min(100, base_score × equity_multiplier)
```

The equity multiplier is the product of matching priority-group boosts, capped at 1.15. Example: PWD (1.08) × 4Ps (1.07) = 1.156 → capped to 1.15.

### Component Formulas

**Academic (0.0–1.0):**
- No GWA data → 0.5 (neutral)
- Meets minimum exactly → 0.75
- Exceeds by 10+ points → 1.0
- Below minimum → 0.25

**Income (0.0–1.0):**
- Merit-based scholarship → 0.5 (neutral)
- Need-based: `1.0 - (income / max_threshold)` (lower income = higher score)
- No income data → 0.4 (slight penalty)

**Field (0.0–1.0):**
- exact → 1.0, broad → 0.75, partial → 0.4, none → 0.0

**Geographic (0.0–1.0):**
- city → 1.0, region → 0.75, island_group → 0.4, none → 0.0

**Equity (0.0–1.0):**
- 2+ priority group matches → 1.0
- 1 match → 0.75
- 0 matches, no priority groups → 0.5
- 0 matches, scholarship has priority groups → 0.0

**Readiness (0.0–1.0):**
- Direct pass-through of document readiness ratio

---

## Equity Logic

Equity multipliers are applied multiplicatively when the student matches a scholarship's priority groups:

| Group | Multiplier | RA Reference |
|-------|------------|--------------|
| PWD | 1.08 | RA 7277 |
| Indigenous Peoples | 1.10 | RA 8371 (IPRA) |
| Solo Parent Dependent | 1.05 | RA 11861 |
| 4Ps/Listahanan | 1.07 | Pantawid Pamilyang Pilipino Program |
| Underprivileged | 1.06 | RA 7279 |
| OFW Dependent | 1.03 | OWWA |
| Farmer/Fisher Dependent | 1.04 | Landbank/Agrarian |

**Cap:** Total equity multiplier is capped at 1.15 to prevent over-boosting.

---

## Configuration Structure

```python
from app.scoring import WeightedDeterministicScorer, ScoringConfig

config = ScoringConfig(
    weights={
        "academic": 0.30,
        "income": 0.25,
        "field_alignment": 0.20,
        "geographic": 0.10,
        "equity_priority": 0.10,
        "readiness": 0.05,
    },
    equity_multipliers={
        "is_pwd": 1.08,
        "is_indigenous_people": 1.10,
        "is_solo_parent_dependent": 1.05,
        "is_4ps_listahanan": 1.07,
        "is_underprivileged": 1.06,
        "is_ofw_dependent": 1.03,
        "is_farmer_fisher_dependent": 1.04,
    },
    max_equity_multiplier=1.15,
    income_bracket_midpoints={
        "below_250k": 125_000,
        "250k_400k": 325_000,
        "400k_500k": 450_000,
        "above_500k": 600_000,
    },
)

scorer = WeightedDeterministicScorer(config=config)
```

**To adjust weights:** Modify the `weights` dict. Ensure weights sum to 1.0. No code changes required.

---

## Example Scoring Walkthrough

**Student profile:**
- GWA: 88% (normalized)
- Income: PHP 180,000
- Field: Engineering
- Region: NCR
- PWD: Yes
- Documents: 3 of 5 uploaded (60%)

**Scholarship:**
- Min GWA: 75%
- Max income: PHP 250,000
- Eligible courses: Engineering
- Eligible regions: NCR
- Priority groups: PWD

**Component scores:**
- Academic: 0.88 (exceeds min by 13 points)
- Income: 0.28 (180k/250k = 0.72, so 1 - 0.72 = 0.28)
- Field: 1.0 (exact match)
- Geographic: 0.75 (region match)
- Equity: 0.75 (1 priority group match)
- Readiness: 0.6 (60%)

**Base score:**
(0.88×0.30 + 0.28×0.25 + 1.0×0.20 + 0.75×0.10 + 0.75×0.10 + 0.6×0.05) × 100 = 72.15

**Equity multiplier:** 1.08 (PWD)

**Final score:** min(100, 72.15 × 1.08) = 77.92

---

## Inline Code Documentation Guidelines

**Where comments must exist:**
- At the top of each module: purpose and scope
- For each scoring component function: input/output semantics and edge cases
- For config fields: meaning and valid ranges
- For equity multiplier logic: policy reference (RA numbers)

**What must be documented:**
- How missing data is handled (GWA, income)
- How scholarship type affects income scoring (merit vs need)
- How equity flags map to priority groups
- The equity multiplier cap and why it exists

**How to modify weights safely:**
1. Edit `ScoringConfig` or pass a custom config to `WeightedDeterministicScorer`
2. Ensure weights sum to 1.0
3. Run `pytest app/tests/test_scoring_engine.py` to verify
4. Document the change and rationale in this file or a changelog
