from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from pydantic_core import CoreSchema, core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: CoreSchema, handler: Any
    ) -> Dict[str, Any]:
        return {"type": "string"}

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
    dietary_recommendations: Optional[List[str]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserBase(BaseModel):
    email: EmailStr
    first_name: str

class UserCreate(UserBase):
    password: str
    profile: UserProfile

class User(UserBase):
    id: str
    profile: Dict[str, Any]
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

class MealCreate(BaseModel):
    meal_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    date: Optional[str] = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    image_url: Optional[str] = None
    ingredients: List[str] = Field(default_factory=list)
    cooking_method: Optional[str] = None
    serving_size: Optional[str] = None
    macronutrients: Dict[str, float] = Field(default_factory=dict)
    scores: Dict[str, float] = Field(default_factory=dict)
    health_tags: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    recommended_recipes: List[str] = Field(default_factory=list)
    health_benefits: List[str] = Field(default_factory=list)
    potential_concerns: List[str] = Field(default_factory=list)
    micronutrient_balance: Optional[Dict[str, Any]] = Field(default_factory=dict)

class Meal(MealCreate):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ChatHistory(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    title: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    image_url: Optional[str] = None
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    meal_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SavedRecipe(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    recipe_id: str
    title: str
    image: Optional[str] = None
    timeInMinutes: Optional[int] = None
    spiceLevel: Optional[int] = None
    pricePerPortion: Optional[float] = None
    nutrition: Optional[Dict[str, Any]] = None
    tags: Optional[Dict[str, Any]] = None
    healthBenefits: Optional[List[str]] = Field(default_factory=list)
    dietaryPreference: Optional[List[str]] = Field(default_factory=list)
    mealType: Optional[str] = None
    culturalStyle: Optional[str] = None
    mealPreference: Optional[str] = None
    introduction: Optional[str] = None
    ingredients: Optional[List[str]] = Field(default_factory=list)
    instructions: Optional[List[str]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Supplement(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    name: str
    dose: str
    date: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
