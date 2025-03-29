from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class Height(BaseModel):
    value: float
    unit: str

class Weight(BaseModel):
    value: float
    unit: str

class MealLog(BaseModel):
    timestamp: datetime
    food_items: List[Dict[str, Any]]
    total_calories: float
    total_macros: Dict[str, float]
    total_fiber: float
    total_sugar: float
    total_sodium: float
    health_notes: List[str]

class NutritionalNeeds(BaseModel):
    calories: Dict[str, float]
    macros: Dict[str, Dict[str, Any]]
    other_nutrients: Dict[str, Dict[str, Any]]

class UserProfile(BaseModel):
    date_of_birth: str
    age: int
    sex: str
    height: Height
    weight: Weight
    activity_level: str
    personal_health_history: List[str]
    family_health_history: List[str]
    priority_micronutrients: List[str]
    dietary_preferences: List[str]
    meals_per_day: int
    foods_to_avoid: List[str]
    health_goals: List[str]
    nutritional_needs: Optional[NutritionalNeeds] = None
    nutritional_plan: Optional[Dict[str, Any]] = None
    meal_history: Optional[List[MealLog]] = []
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    first_name: str

class UserCreate(UserBase):
    password: str
    profile: UserProfile

class User(UserBase):
    id: str
    profile: UserProfile
    created_at: datetime
    updated_at: datetime
    is_active: bool
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: Optional[str] = None
