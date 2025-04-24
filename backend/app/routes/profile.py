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
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        logger.info("=== Starting Profile Update ===")
        logger.info(f"Current user ID: {current_user.id}")
        logger.info(f"Received profile data: {json.dumps(profile_data, default=str)}")

        # Remove fields that shouldn't be updated
        profile_data.pop("id", None)
        profile_data.pop("_id", None)
        profile_data.pop("password", None)
        profile_data.pop("created_at", None)

        # Update the timestamp
        profile_data["updated_at"] = datetime.utcnow()

        # Map IDs to full text labels if profile data exists
        if "profile" in profile_data:
            try:
                profile = profile_data["profile"]
                logger.info(f"Processing profile data: {json.dumps(profile, default=str)}")
                
                # Handle date_of_birth update
                if "date_of_birth" in profile:
                    try:
                        # Convert date string to datetime for validation
                        datetime.strptime(profile["date_of_birth"], "%Y-%m-%d")
                        logger.info(f"Valid date_of_birth: {profile['date_of_birth']}")
                    except ValueError as e:
                        logger.error(f"Invalid date format: {profile['date_of_birth']}")
                        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

                if "activity_level" in profile:
                    profile["activity_level"] = map_activity_level(profile["activity_level"])
                    logger.info(f"Mapped activity level: {profile['activity_level']}")
                if "personal_health_history" in profile:
                    profile["personal_health_history"] = map_health_conditions(profile["personal_health_history"])
                    logger.info(f"Mapped personal health history: {profile['personal_health_history']}")
                if "family_health_history" in profile:
                    profile["family_health_history"] = map_health_conditions(profile["family_health_history"])
                    logger.info(f"Mapped family health history: {profile['family_health_history']}")
                if "priority_micronutrients" in profile:
                    profile["priority_micronutrients"] = map_micronutrients(profile["priority_micronutrients"])
                    logger.info(f"Mapped micronutrients: {profile['priority_micronutrients']}")
                if "health_goals" in profile:
                    profile["health_goals"] = map_health_goals(profile["health_goals"])
                    logger.info(f"Mapped health goals: {profile['health_goals']}")
                
                logger.info(f"Processed profile data: {json.dumps(profile, default=str)}")
            except Exception as e:
                logger.error(f"Error processing profile data: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Error processing profile data: {str(e)}")

        # First, check if the user exists
        user_exists = await db.user_profiles.find_one({"_id": ObjectId(current_user.id)})
        if not user_exists:
            logger.error(f"User not found with ID: {current_user.id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Update the user profile
        try:
            logger.info(f"Attempting to update user profile with ID: {current_user.id}")
            result = await db.user_profiles.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$set": profile_data}
            )
            logger.info(f"Update result: {result.modified_count} documents modified")
            logger.info(f"Update matched: {result.matched_count} documents matched")
        except Exception as e:
            logger.error(f"Database update error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database update error: {str(e)}")

        if result.modified_count == 0:
            logger.warning(f"No changes made to profile for user {current_user.id}")
            raise HTTPException(status_code=404, detail="No changes were made to the profile")

        # Fetch and return the updated user
        try:
            logger.info(f"Fetching updated user profile for ID: {current_user.id}")
            updated_user = await db.user_profiles.find_one({"_id": ObjectId(current_user.id)})
            if updated_user:
                # Convert ObjectId to string for JSON serialization
                updated_user["id"] = str(updated_user["_id"])
                del updated_user["_id"]
                updated_user.pop("password", None)
                logger.info(f"Successfully updated profile for user {current_user.id}")
                return updated_user
            else:
                logger.error(f"User not found after update for user {current_user.id}")
                raise HTTPException(status_code=404, detail="User not found after update")
        except Exception as e:
            logger.error(f"Error fetching updated user: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error fetching updated user: {str(e)}")

    except HTTPException as he:
        logger.error(f"HTTP Exception in update_profile: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in update_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    finally:
        logger.info("=== Profile Update Completed ===")

@router.get("/me")
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
