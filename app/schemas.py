from pydantic import BaseModel
from typing import List, Optional


class StudentProfile(BaseModel):
    full_name: str
    email: str
    age: Optional[int] = None
    region: Optional[str] = None
    school: Optional[str] = None
    needs: Optional[List[str]] = []


class StudentProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    age: Optional[int] = None
    region: Optional[str] = None
    school: Optional[str] = None
    needs: Optional[List[str]] = []

    class Config:
        from_attributes = True


class Scholarship(BaseModel):
    title: str
    provider: Optional[str] = None
    countries: Optional[List[str]] = []
    regions: Optional[List[str]] = []
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    needs_tags: Optional[List[str]] = []
    link: Optional[str] = None
    description: Optional[str] = None


class ScholarshipResponse(BaseModel):
    id: int
    title: str
    provider: Optional[str] = None
    countries: Optional[List[str]] = []
    regions: Optional[List[str]] = []
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    needs_tags: Optional[List[str]] = []
    link: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: int
    title: str
    provider: Optional[str] = None
    score: float
    link: Optional[str] = None
    description: Optional[str] = None