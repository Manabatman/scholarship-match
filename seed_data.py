"""
Seed script to populate the database with sample scholarships and profiles
"""
import json
from app.db import SessionLocal, engine, Base
from app import models

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if data already exists
    existing = db.query(models.Scholarship).first()
    if existing:
        print("Database already has data. Skipping seed.")
    else:
        # Sample Scholarships
        scholarships = [
            {
                "title": "CHED Merit Scholarship Program",
                "provider": "Commission on Higher Education (CHED)",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 25,
                "needs_tags": ["Financial Aid", "Merit-based"],
                "link": "https://ched.gov.ph/merit-scholarship",
                "description": "A merit-based scholarship program for academically excellent students with financial needs."
            },
            {
                "title": "DOST-SEI Undergraduate Scholarship",
                "provider": "Department of Science and Technology - Science Education Institute",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 17,
                "max_age": 22,
                "needs_tags": ["STEM", "Financial Aid", "Science"],
                "link": "https://ugs.science-scholarships.ph",
                "description": "Scholarship for students pursuing Science, Technology, Engineering, and Mathematics (STEM) courses."
            },
            {
                "title": "SM Foundation College Scholarship",
                "provider": "SM Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 28,
                "needs_tags": ["Financial Aid", "Underprivileged"],
                "link": "https://sm-foundation.org/scholarship",
                "description": "Educational assistance for financially challenged students with good academic standing."
            },
            {
                "title": "Ayala Foundation Scholarship Program",
                "provider": "Ayala Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon"],
                "min_age": 16,
                "max_age": 25,
                "needs_tags": ["Financial Aid", "Leadership"],
                "link": "https://ayalafoundation.org/scholarships",
                "description": "Scholarship for outstanding students who demonstrate leadership potential and financial need."
            },
            {
                "title": "Gokongwei Brothers Foundation Scholarship",
                "provider": "Gokongwei Brothers Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon"],
                "min_age": 17,
                "max_age": 24,
                "needs_tags": ["STEM", "Engineering", "Financial Aid"],
                "link": "https://gokongweifoundation.org/scholarship",
                "description": "Scholarship program for engineering and technology students from underprivileged backgrounds."
            },
            {
                "title": "Metrobank Foundation Scholarship",
                "provider": "Metrobank Foundation",
                "countries": ["Philippines"],
                "regions": ["Metro Manila", "Luzon", "Visayas", "Mindanao"],
                "min_age": 16,
                "max_age": 30,
                "needs_tags": ["Financial Aid", "Merit-based"],
                "link": "https://metrobank-foundation.org/scholarship",
                "description": "Comprehensive scholarship program for deserving students with excellent academic records."
            },
        ]

        print("Seeding scholarships...")
        for scholarship_data in scholarships:
            scholarship = models.Scholarship(
                title=scholarship_data["title"],
                provider=scholarship_data["provider"],
                countries=",".join(scholarship_data["countries"]),
                regions=",".join(scholarship_data["regions"]),
                min_age=scholarship_data["min_age"],
                max_age=scholarship_data["max_age"],
                needs_tags=json.dumps(scholarship_data["needs_tags"]),
                link=scholarship_data["link"],
                description=scholarship_data["description"],
            )
            db.add(scholarship)

        db.commit()
        print(f"✓ Successfully seeded {len(scholarships)} scholarships!")
        
except Exception as e:
    print(f"Error seeding data: {e}")
    db.rollback()
finally:
    db.close()
