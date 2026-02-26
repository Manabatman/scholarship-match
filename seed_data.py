"""
Seed script to populate the database with sample scholarships and profiles.
Adds migration for new columns (education_level, level) if DB already exists.
"""
import json
from app.db import SessionLocal, engine, Base
from app import models

# Create tables (or add new columns via migration)
Base.metadata.create_all(bind=engine)

# Migration: add new columns if they don't exist (for existing DBs)
def migrate_schema():
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text(
                "ALTER TABLE students ADD COLUMN education_level VARCHAR"
            ))
            conn.commit()
    except Exception:
        pass
    try:
        with engine.connect() as conn:
            conn.execute(text(
                "ALTER TABLE scholarships ADD COLUMN level VARCHAR"
            ))
            conn.commit()
    except Exception:
        pass

migrate_schema()

db = SessionLocal()

try:
    existing = db.query(models.Scholarship).first()
    if existing:
        print("Database already has data. Skipping seed.")
    else:
        scholarships = [
            # Government
            {
                "title": "CHED Merit Scholarship Program",
                "provider": "Commission on Higher Education (CHED)",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 25,
                "needs_tags": ["Financial Aid", "Merit-based"],
                "level": "College",
                "link": "https://ched.gov.ph/merit-scholarship",
                "description": "Merit-based scholarship for academically excellent students with financial needs.",
            },
            {
                "title": "DOST-SEI Undergraduate Scholarship",
                "provider": "Department of Science and Technology - SEI",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 17,
                "max_age": 22,
                "needs_tags": ["STEM", "Financial Aid", "Science", "Engineering"],
                "level": "College",
                "link": "https://ugs.science-scholarships.ph",
                "description": "STEM scholarship for Science, Technology, Engineering, and Mathematics courses.",
            },
            {
                "title": "DOST-SEI Graduate Scholarship",
                "provider": "Department of Science and Technology - SEI",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 22,
                "max_age": 45,
                "needs_tags": ["STEM", "Financial Aid", "Graduate"],
                "level": "Graduate",
                "link": "https://science-scholarships.ph",
                "description": "Graduate scholarship for master's and doctoral programs in STEM.",
            },
            {
                "title": "TESDA Scholarship Program",
                "provider": "Technical Education and Skills Development Authority",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 15,
                "max_age": 60,
                "needs_tags": ["Vocational/TVET", "Financial Aid"],
                "level": "TVET",
                "link": "https://tesda.gov.ph",
                "description": "Technical-vocational education and training scholarships nationwide.",
            },
            {
                "title": "CHED-Tulong Dulong Program",
                "provider": "Commission on Higher Education",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 30,
                "needs_tags": ["Financial Aid", "Underprivileged"],
                "level": "College",
                "link": "https://ched.gov.ph",
                "description": "Financial assistance for students from low-income families.",
            },
            {
                "title": "UniFAST Tertiary Education Subsidy",
                "provider": "Unified Student Financial Assistance System",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 35,
                "needs_tags": ["Financial Aid"],
                "level": "College",
                "link": "https://unifast.gov.ph",
                "description": "Tertiary education subsidy for eligible Filipino students.",
            },
            {
                "title": "GSIS Scholarship Program",
                "provider": "Government Service Insurance System",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 25,
                "needs_tags": ["GSIS Dependent", "Financial Aid"],
                "level": "College",
                "link": "https://gsis.gov.ph",
                "description": "Scholarship for children of GSIS members.",
            },
            {
                "title": "SSS Educational Loan Program",
                "provider": "Social Security System",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 30,
                "needs_tags": ["Financial Aid"],
                "level": "College",
                "link": "https://sss.gov.ph",
                "description": "Study now, pay later program for SSS members and dependents.",
            },
            {
                "title": "OWWA Education and Training Program",
                "provider": "Overseas Workers Welfare Administration",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 30,
                "needs_tags": ["OFW Dependent", "Financial Aid"],
                "level": "College",
                "link": "https://owwa.gov.ph",
                "description": "Scholarship for dependents of OFWs.",
            },
            # Private Foundations
            {
                "title": "SM Foundation College Scholarship",
                "provider": "SM Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 28,
                "needs_tags": ["Financial Aid", "Underprivileged"],
                "level": "College",
                "link": "https://sm-foundation.org/scholarship",
                "description": "Educational assistance for financially challenged students with good academics.",
            },
            {
                "title": "Ayala Foundation Scholarship Program",
                "provider": "Ayala Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon"],
                "min_age": 16,
                "max_age": 25,
                "needs_tags": ["Financial Aid", "Leadership"],
                "level": "College",
                "link": "https://ayalafoundation.org/scholarships",
                "description": "Scholarship for students with leadership potential and financial need.",
            },
            {
                "title": "Gokongwei Brothers Foundation Scholarship",
                "provider": "Gokongwei Brothers Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon"],
                "min_age": 17,
                "max_age": 24,
                "needs_tags": ["STEM", "Engineering", "Financial Aid"],
                "level": "College",
                "link": "https://gokongweifoundation.org/scholarship",
                "description": "Engineering and technology scholarship for underprivileged students.",
            },
            {
                "title": "Metrobank Foundation Scholarship",
                "provider": "Metrobank Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 30,
                "needs_tags": ["Financial Aid", "Merit-based"],
                "level": "College",
                "link": "https://metrobank-foundation.org/scholarship",
                "description": "Scholarship for deserving students with excellent academic records.",
            },
            {
                "title": "BPI Foundation Scholarship",
                "provider": "BPI Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 28,
                "needs_tags": ["Financial Aid", "Merit-based"],
                "level": "College",
                "link": "https://bpifoundation.org",
                "description": "College scholarship for academically gifted students.",
            },
            {
                "title": "San Miguel Foundation Scholarship",
                "provider": "San Miguel Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 17,
                "max_age": 25,
                "needs_tags": ["Financial Aid", "Engineering", "Business"],
                "level": "College",
                "link": "https://sanmiguel.com.ph/foundation",
                "description": "Scholarship for engineering, business, and related fields.",
            },
            {
                "title": "PLDT-Smart Foundation Scholarship",
                "provider": "PLDT-Smart Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 17,
                "max_age": 25,
                "needs_tags": ["IT", "STEM", "Financial Aid"],
                "level": "College",
                "link": "https://pldtsmartfoundation.org",
                "description": "Scholarship for IT and tech-related degree programs.",
            },
            # High School
            {
                "title": "DepEd SHS Voucher Program",
                "provider": "Department of Education",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 15,
                "max_age": 20,
                "needs_tags": ["Financial Aid"],
                "level": "High School",
                "link": "https://deped.gov.ph",
                "description": "Voucher program for senior high school students.",
            },
            {
                "title": "Ateneo High School Financial Aid",
                "provider": "Ateneo de Manila University",
                "countries": ["Philippines"],
                "regions": ["Metro Manila"],
                "min_age": 12,
                "max_age": 18,
                "needs_tags": ["Financial Aid", "Merit-based"],
                "level": "High School",
                "link": "https://ateneo.edu",
                "description": "Need-based financial aid for high school students.",
            },
            # Graduate
            {
                "title": "CHED K-12 Transition Scholarship",
                "provider": "Commission on Higher Education",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 18,
                "max_age": 35,
                "needs_tags": ["Financial Aid", "Graduate"],
                "level": "Graduate",
                "link": "https://ched.gov.ph",
                "description": "Graduate scholarship for educators and professionals.",
            },
            {
                "title": "ERC Graduate Fellowship",
                "provider": "Energy Regulatory Commission",
                "countries": ["Philippines"],
                "regions": ["Metro Manila"],
                "min_age": 22,
                "max_age": 40,
                "needs_tags": ["Engineering", "STEM", "Graduate"],
                "level": "Graduate",
                "link": "https://erc.gov.ph",
                "description": "Graduate fellowship for energy-related studies.",
            },
            # LGU / Sectoral
            {
                "title": "Pasig City Scholarship Program",
                "provider": "Pasig City LGU",
                "countries": ["Philippines"],
                "regions": ["Metro Manila"],
                "min_age": 16,
                "max_age": 30,
                "needs_tags": ["Financial Aid"],
                "level": "College",
                "link": "https://pasigcity.gov.ph",
                "description": "Local scholarship for Pasig City residents.",
            },
            {
                "title": "Quezon City Scholarship",
                "provider": "Quezon City LGU",
                "countries": ["Philippines"],
                "regions": ["Metro Manila"],
                "min_age": 16,
                "max_age": 35,
                "needs_tags": ["Financial Aid", "Merit-based"],
                "level": "College",
                "link": "https://quezoncity.gov.ph",
                "description": "Scholarship for QC residents pursuing higher education.",
            },
            {
                "title": "Philippine Normal University Scholarship",
                "provider": "Philippine Normal University",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 17,
                "max_age": 30,
                "needs_tags": ["Education", "Financial Aid"],
                "level": "College",
                "link": "https://pnu.edu.ph",
                "description": "Scholarship for future educators.",
            },
            {
                "title": "UP Presidential Scholarship",
                "provider": "University of the Philippines",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 25,
                "needs_tags": ["Merit-based", "Financial Aid"],
                "level": "College",
                "link": "https://up.edu.ph",
                "description": "Merit-based scholarship for top UPCAT passers.",
            },
        ]

        print("Seeding scholarships...")
        for s in scholarships:
            db.add(models.Scholarship(
                title=s["title"],
                provider=s["provider"],
                countries=",".join(s["countries"]),
                regions=",".join(s["regions"]),
                min_age=s["min_age"],
                max_age=s["max_age"],
                needs_tags=json.dumps(s["needs_tags"]),
                level=s.get("level"),
                link=s["link"],
                description=s["description"],
            ))
        db.commit()
        print(f"Successfully seeded {len(scholarships)} scholarships!")

except Exception as e:
    print(f"Error seeding data: {e}")
    db.rollback()
    raise
finally:
    db.close()
