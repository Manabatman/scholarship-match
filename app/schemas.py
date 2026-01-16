from pydantic import BaseModel
from typing import Optional

class StudentProfile(BaseModel):
    name: str
    gpa: Optional[float] = None
    major: Optional[str] = None
    financial_need: Optional[float] = None
    # Add other relevant fields as needed

class MatchItem(BaseModel):
    name: str
    link: str
    score: int
