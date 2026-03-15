"""
CSV Scholarship Import Script for ISKONNECT.

Loads scraped scholarship CSV files, cleans and maps data to the Scholarship model,
and inserts records into the database with duplicate prevention and batch insertion.

Usage:
    python -m app.scripts.import_scholarships --csv path/to/scholarships.csv
"""
import argparse
import csv
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.db import SessionLocal
from app import models


# --- CSV Loading ---

def load_csv(filepath: str) -> list[dict]:
    """
    Load CSV file and return list of row dicts.
    Normalizes column names: lowercase, strip whitespace.
    Handles both 'url' and 'link' columns (maps to 'link').
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {filepath}")

    rows = []
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        raw_fieldnames = reader.fieldnames or []
        # Normalize: lowercase, strip, and map url -> link for consistency
        normalized = {}
        for fn in raw_fieldnames:
            key = fn.strip().lower().replace(" ", "_")
            if key == "url":
                key = "link"
            normalized[fn] = key

        for row in reader:
            cleaned = {}
            for orig_key, raw_val in row.items():
                norm_key = normalized.get(orig_key, orig_key.strip().lower().replace(" ", "_"))
                if norm_key == "url":
                    norm_key = "link"
                val = raw_val.strip() if isinstance(raw_val, str) else raw_val
                cleaned[norm_key] = val if val else None
            rows.append(cleaned)

    return rows


# --- Parsers ---

def parse_deadline(text: str | None) -> date | None:
    """
    Extract date from free-text deadline strings.
    Handles: "March 24, 2026", "Feb. 14, 2025, 11:59 p.m.", "2025-02-14", "2026-03-15"
    """
    if not text or not text.strip():
        return None

    text = text.strip()

    # ISO format: 2025-02-14 or 2026-03-15
    iso_match = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", text)
    if iso_match:
        try:
            y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
            return date(y, m, d)
        except ValueError:
            pass

    # Month DD, YYYY or Month. DD, YYYY
    month_names = [
        "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec"
    ]
    for i, month in enumerate(month_names, 1):
        month_str = f"({month}|{month}\\.)"
        pat = re.compile(
            rf"{month_str}\s*(\d{{1,2}})\s*,?\s*(\d{{4}})",
            re.IGNORECASE
        )
        m = pat.search(text)
        if m:
            try:
                dd, yy = int(m.group(2)), int(m.group(3))
                return date(yy, i, dd)
            except ValueError:
                pass

    # DD Month YYYY
    for i, month in enumerate(month_names, 1):
        pat = re.compile(
            rf"(\d{{1,2}})\s+{month}\.??\s+(\d{{4}})",
            re.IGNORECASE
        )
        m = pat.search(text)
        if m:
            try:
                dd, yy = int(m.group(1)), int(m.group(2))
                return date(yy, i, dd)
            except ValueError:
                pass

    return None


def parse_qualifications(text: str | None) -> dict:
    """
    Extract structured fields from qualification text.
    Returns: max_income, min_gwa_normalized, eligible_courses_specific, eligible_regions
    """
    result = {
        "max_income_threshold": None,
        "min_gwa_normalized": None,
        "eligible_courses_specific": [],
        "eligible_regions": [],
    }

    if not text or not text.strip():
        return result

    lines = text.lower().split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Income: "Parent Annual Income must be equal or lower than: Php 350,000"
        # or "income must not exceed Php300,000" or "Php 400,000"
        income_match = re.search(
            r"php\s*([\d,]+)\s*",
            line,
            re.IGNORECASE
        )
        if income_match and ("income" in line or "gross" in line or "combined" in line):
            try:
                val = int(income_match.group(1).replace(",", ""))
                if result["max_income_threshold"] is None or val < result["max_income_threshold"]:
                    result["max_income_threshold"] = val
            except ValueError:
                pass

        # GWA 5.0 scale (SIKAP): "GWA must be better or equal to: 3.0000"
        # Lower is better: 1.0 = 100%, 5.0 = 0%. Formula: (5 - gwa) / 4 * 100
        gwa_5_match = re.search(
            r"gwa\s+must\s+be\s+better\s+or\s+equal\s+to:\s*([\d.]+)",
            line,
            re.IGNORECASE
        )
        if gwa_5_match:
            try:
                gwa = float(gwa_5_match.group(1))
                gwa_normalized = (5.0 - gwa) / 4.0 * 100.0
                result["min_gwa_normalized"] = max(0.0, min(100.0, gwa_normalized))
            except ValueError:
                pass

        # GWA percentage (PhilScholar): "general average of at least 88%, with no subject grade lower than 80%"
        gwa_pct_match = re.search(
            r"(?:average|gwa|general\s+average)\s+.*?(\d{2,3})\s*%",
            line,
            re.IGNORECASE
        )
        if gwa_pct_match and result["min_gwa_normalized"] is None:
            try:
                pct = float(gwa_pct_match.group(1))
                result["min_gwa_normalized"] = max(0.0, min(100.0, pct))
            except ValueError:
                pass

        # Courses: "Courses must be within the ff: BS Chemistry, BSEd ..."
        if "courses must be within" in line or "courses must be within the ff:" in line:
            # Extract after colon
            after_colon = line.split(":", 1)[-1].strip()
            courses = [c.strip() for c in re.split(r",\s*", after_colon) if c.strip()]
            result["eligible_courses_specific"] = courses

        # University/Region: "University must be within the ff: UP Diliman"
        if "university must be within" in line or "university must be within the ff:" in line:
            after_colon = line.split(":", 1)[-1].strip()
            unis = [u.strip() for u in re.split(r",\s*", after_colon) if u.strip()]
            result["eligible_regions"] = unis

    return result


def parse_benefits(text: str | None) -> dict:
    """
    Parse pipe-delimited benefits string.
    Returns: benefit_tuition, benefit_allowance_monthly, benefit_books, benefit_miscellaneous
    """
    result = {
        "benefit_tuition": False,
        "benefit_allowance_monthly": None,
        "benefit_books": False,
        "benefit_miscellaneous": None,
    }

    if not text or not text.strip():
        return result

    parts = [p.strip() for p in text.split("|") if p.strip()]

    tuition_keywords = ["tuition", "school fees", "tuition &", "full coverage", "matriculation", "enrollment"]
    book_keywords = ["book", "books"]

    allowance_amounts = []

    for part in parts:
        part_lower = part.lower()
        if any(kw in part_lower for kw in tuition_keywords):
            result["benefit_tuition"] = True
        if any(kw in part_lower for kw in book_keywords):
            result["benefit_books"] = True

        # Monthly allowance: "Php 5,000.00 per month", "Monthly | Php 10000", "Php 3000"
        amount_match = re.search(r"php\s*([\d,]+)(?:\.\d+)?", part, re.IGNORECASE)
        if amount_match:
            try:
                amt = int(amount_match.group(1).replace(",", ""))
                if "monthly" in part_lower or "per month" in part_lower or "stipend" in part_lower:
                    allowance_amounts.append(amt)
                elif "semestral" in part_lower or "semester" in part_lower:
                    # Approximate monthly: semestral / 5
                    allowance_amounts.append(amt // 5)
                else:
                    allowance_amounts.append(amt)
            except ValueError:
                pass

    if allowance_amounts:
        result["benefit_allowance_monthly"] = max(allowance_amounts)

    misc_parts = [p for p in parts if p and not re.match(r"^php\s*[\d,]+", p, re.IGNORECASE)]
    if misc_parts:
        result["benefit_miscellaneous"] = " | ".join(misc_parts[:10])  # Limit length

    return result


# --- Data Cleaning ---

def clean_row(row: dict) -> dict | None:
    """
    Map a CSV row to Scholarship model fields.
    Trims whitespace, validates URLs, returns None if row is invalid (no title).
    """
    title = (row.get("title") or "").strip()
    if not title:
        return None

    link = (row.get("link") or "").strip()
    if link and not (link.startswith("http://") or link.startswith("https://")):
        link = None

    # Description: content > excerpt > primary_qualifications
    content = (row.get("content") or "").strip()
    excerpt = (row.get("excerpt") or "").strip()
    primary_qual = (row.get("primary_qualifications") or "").strip()
    secondary_qual = (row.get("secondary_qualifications") or "").strip()

    description = content or excerpt
    if description and (primary_qual or secondary_qual):
        description = description + "\n\nEligibility:\n" + (primary_qual or "") + "\n" + (secondary_qual or "")
    elif primary_qual or secondary_qual:
        description = (primary_qual or "") + "\n" + (secondary_qual or "")

    # Parse structured fields
    parsed_qual = parse_qualifications(primary_qual or secondary_qual)
    parsed_ben = parse_benefits(row.get("benefits"))
    parsed_deadline = parse_deadline(row.get("deadline"))

    # Source
    source = (row.get("source") or "").strip()
    if not source and link:
        if "sikap.upd.edu.ph" in link:
            source = "sikap"
        elif "philscholar.com" in link:
            source = "philscholar"

    # is_active: False if deadline has passed
    is_active = True
    if parsed_deadline and parsed_deadline < date.today():
        is_active = False

    return {
        "title": title,
        "provider": None,  # Not reliably in CSV
        "source": source or None,
        "link": link or None,
        "description": description[:10000] if description else None,  # Limit length
        "countries": "Philippines",
        "regions": ",".join(parsed_qual["eligible_regions"]) if parsed_qual["eligible_regions"] else None,
        "eligible_regions": json.dumps(parsed_qual["eligible_regions"]) if parsed_qual["eligible_regions"] else None,
        "eligible_courses_specific": json.dumps(parsed_qual["eligible_courses_specific"]) if parsed_qual["eligible_courses_specific"] else None,
        "max_income_threshold": parsed_qual["max_income_threshold"],
        "min_gwa_normalized": parsed_qual["min_gwa_normalized"],
        "benefit_tuition": parsed_ben["benefit_tuition"],
        "benefit_allowance_monthly": parsed_ben["benefit_allowance_monthly"],
        "benefit_books": parsed_ben["benefit_books"],
        "benefit_miscellaneous": parsed_ben["benefit_miscellaneous"],
        "application_deadline": parsed_deadline,
        "is_active": is_active,
        "eligible_levels": json.dumps(["College"]),  # Default
        "eligible_cities": None,
        "residency_required": False,
        "eligible_school_types": json.dumps(["Public", "Private"]),
        "eligible_courses_psced": None,
        "min_age": None,
        "max_age": None,
        "provider_type": None,
        "scholarship_type": None,
        "priority_groups": None,
        "preferred_extracurriculars": None,
        "preferred_awards": None,
        "benefit_total_value": None,
        "required_documents": None,
        "has_qualifying_exam": False,
        "has_interview": False,
        "has_essay_requirement": False,
        "has_return_service": False,
        "application_open_date": None,
        "academic_year_target": None,
        "level": "College",
        "needs_tags": None,
    }


# --- Duplicate Check & Batch Insert ---

def get_existing_keys(db) -> set[tuple[str, str | None]]:
    """Return set of (title_lower, link) for existing scholarships."""
    scholarships = db.query(models.Scholarship).all()
    return {(s.title.lower().strip(), s.link or "") for s in scholarships}


def run_import(csv_path: str, batch_size: int = 50) -> dict:
    """
    Load CSV, clean rows, skip duplicates, batch insert.
    Returns summary dict: total, inserted, skipped, errors.
    """
    rows = load_csv(csv_path)
    total = len(rows)

    db = SessionLocal()
    existing_keys = get_existing_keys(db)

    inserted = 0
    skipped = 0
    errors = 0
    batch: list[models.Scholarship] = []

    for i, row in enumerate(rows):
        cleaned = clean_row(row)
        if not cleaned:
            skipped += 1
            continue

        title_lower = cleaned["title"].lower().strip()
        link = cleaned["link"] or ""
        key = (title_lower, link)

        if key in existing_keys:
            skipped += 1
            continue

        try:
            scholarship = models.Scholarship(**cleaned)
            batch.append(scholarship)
            existing_keys.add(key)
        except Exception as e:
            print(f"  Row {i + 1}: error creating record: {e}", file=sys.stderr)
            errors += 1
            continue

        if len(batch) >= batch_size:
            try:
                db.add_all(batch)
                db.commit()
                inserted += len(batch)
                batch = []
            except Exception as e:
                db.rollback()
                print(f"  Batch error at row {i + 1}: {e}", file=sys.stderr)
                errors += len(batch)
                batch = []

    if batch:
        try:
            db.add_all(batch)
            db.commit()
            inserted += len(batch)
        except Exception as e:
            db.rollback()
            print(f"  Final batch error: {e}", file=sys.stderr)
            errors += len(batch)

    db_total = db.query(models.Scholarship).count()
    db.close()

    return {
        "total": total,
        "inserted": inserted,
        "skipped": skipped,
        "errors": errors,
        "db_total": db_total,
    }


# --- Main ---

def main():
    parser = argparse.ArgumentParser(
        description="Import scholarship data from CSV into ISKONNECT database."
    )
    parser.add_argument(
        "--csv",
        required=True,
        help="Path to CSV file (e.g., scholarships.csv)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Number of rows per batch (default: 50)",
    )
    args = parser.parse_args()

    print(f"Loading CSV: {args.csv}")
    summary = run_import(args.csv, batch_size=args.batch_size)

    print("\n=== Import Summary ===")
    print(f"Total CSV rows:    {summary['total']}")
    print(f"Inserted:         {summary['inserted']}")
    print(f"Skipped (dupes):  {summary['skipped']}")
    print(f"Errors:           {summary['errors']}")
    print(f"DB total now:      {summary['db_total']}")


if __name__ == "__main__":
    main()
