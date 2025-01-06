from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import user_profiles

router = APIRouter()

# Profile model
class Profile(BaseModel):
    email: str
    age: int
    sex: str
    height: dict
    weight: float
    activity_level: str
    health_goal: str

# Update profile route
@router.post("/update", tags=["Profile"])
async def update_profile(profile: Profile):
    result = user_profiles.update_one(
        {"email": profile.email},
        {"$set": {"profile": profile.dict(exclude={"email"})}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Profile updated successfully"}
