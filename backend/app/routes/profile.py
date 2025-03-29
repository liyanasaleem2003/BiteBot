from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.routes.database import get_database
from app.models import UserProfile, User
from app.auth import get_current_user
from app.utils import (
    map_health_conditions,
    map_activity_level,
    map_micronutrients,
    map_health_goals
)
from bson import ObjectId
from datetime import datetime

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
@router.put("/update")
async def update_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    try:
        # Map IDs to full text labels
        if "profile" in profile_data:
            profile = profile_data["profile"]
            if "activity_level" in profile:
                profile["activity_level"] = map_activity_level(profile["activity_level"])
            if "personal_health_history" in profile:
                profile["personal_health_history"] = map_health_conditions(profile["personal_health_history"])
            if "family_health_history" in profile:
                profile["family_health_history"] = map_health_conditions(profile["family_health_history"])
            if "priority_micronutrients" in profile:
                profile["priority_micronutrients"] = map_micronutrients(profile["priority_micronutrients"])
            if "health_goals" in profile:
                profile["health_goals"] = map_health_goals(profile["health_goals"])

        # Add updated_at timestamp
        profile_data["updated_at"] = datetime.utcnow()

        # Update the user profile
        result = await db.user_profiles.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": profile_data}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch and return the updated user
        updated_user = await db.user_profiles.find_one({"_id": ObjectId(current_user.id)})
        if updated_user:
            updated_user["id"] = str(updated_user["_id"])
            del updated_user["_id"]
            updated_user.pop("password", None)
            return updated_user
        else:
            raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
