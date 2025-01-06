from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    email: str
    password: str
    age: int
    bmi: float
    height: float
    family_history: Optional[List[str]]
    goals: Optional[List[str]]
