from sqlalchemy import Column, Integer, String, Text
from app.db import Base

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    age = Column(Integer)
    region = Column(String)
    school = Column(String)
    needs = Column(Text)  # JSON-encoded list

class Scholarship(Base):
    __tablename__ = "scholarships"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    provider = Column(String)
    countries = Column(String)  # CSV string
    regions = Column(String)    # CSV string
    min_age = Column(Integer)
    max_age = Column(Integer)
    needs_tags = Column(Text)   # JSON-encoded list
    link = Column(String)
    description = Column(Text)
