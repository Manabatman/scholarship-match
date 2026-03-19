"""
Create an admin user. Run after migrations.
Usage: python -m app.scripts.create_admin <email> <password>
"""
import sys
from app.db import SessionLocal
from app import models
from app.auth import hash_password


def main():
    if len(sys.argv) != 3:
        print("Usage: python -m app.scripts.create_admin <email> <password>")
        sys.exit(1)
    email, password = sys.argv[1], sys.argv[2]
    if len(password) < 8:
        print("Password must be at least 8 characters")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            existing.password_hash = hash_password(password)
            existing.role = "admin"
            db.commit()
            print(f"Updated existing user {email} to admin role.")
        else:
            user = models.User(
                email=email,
                password_hash=hash_password(password),
                role="admin",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created admin user: {email} (id={user.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
