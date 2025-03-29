from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from typing import Optional
from app.models import UserCreate, User, Token, UserProfile
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.routes.database import get_database
from app.utils import (
    map_health_conditions,
    map_activity_level,
    map_micronutrients,
    map_health_goals
)
from app.utils.gpt import calculate_nutritional_needs
from app.utils.json_utils import json_dumps
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import json

router = APIRouter()

def calculate_bmr(weight: float, height: float, age: int, sex: str) -> float:
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
    if sex.lower() == "male":
        return (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        return (10 * weight) + (6.25 * height) - (5 * age) - 161

def calculate_calorie_target(bmr: float, activity_level: str) -> dict:
    """Calculate calorie target based on activity level"""
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "very_active": 1.725,
        "extra_active": 1.9
    }
    
    multiplier = activity_multipliers.get(activity_level.lower(), 1.2)
    tdee = bmr * multiplier
    
    # Set a reasonable range (±10% of TDEE)
    return {
        "min": round(tdee * 0.9),
        "max": round(tdee * 1.1)
    }

@router.post("/register", response_model=User)
async def register(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    print("=== Starting Registration Process ===")
    print(f"Received registration request for email: {user.email}")
    
    try:
        # Check if user already exists
        existing_user = await db.user_profiles.find_one({"email": user.email})
        if existing_user:
            print(f"Email {user.email} is already registered")
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Create user document
        user_dict = user.dict()
        now = datetime.utcnow()
        user_dict["created_at"] = now
        user_dict["updated_at"] = now
        user_dict["is_active"] = True
        
        # Hash the password before storing
        user_dict["password"] = get_password_hash(user_dict["password"])
        
        # Calculate nutritional needs
        try:
            nutritional_needs = await calculate_nutritional_needs(user_dict["profile"])
            user_dict["profile"]["nutritional_needs"] = nutritional_needs
            print("Successfully calculated nutritional needs")
        except Exception as e:
            print(f"Error calculating nutritional needs: {str(e)}")
            # Set default nutritional needs if calculation fails
            user_dict["profile"]["nutritional_needs"] = {
                "calories": {"min": 2000, "max": 2500},
                "macros": {
                    "protein": {"min": 50, "max": 75, "unit": "g"},
                    "carbs": {"min": 250, "max": 300, "unit": "g"},
                    "fats": {"min": 55, "max": 70, "unit": "g"}
                },
                "other_nutrients": {
                    "fiber": {"min": 25, "max": 30, "unit": "g"},
                    "sugar": {"min": 25, "max": 50, "unit": "g"},
                    "sodium": {"min": 1500, "max": 2300, "unit": "mg"}
                }
            }
            print("Using default nutritional needs")
        
        # Debug logging with proper datetime handling
        print("User data to be inserted:")
        print(json_dumps(user_dict, indent=2))
        
        # Insert user into database
        result = await db.user_profiles.insert_one(user_dict)
        print(f"Successfully inserted user with ID: {result.inserted_id}")
        
        # Get the created user
        created_user = await db.user_profiles.find_one({"_id": result.inserted_id})
        if not created_user:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user"
            )
        
        # Convert ObjectId to string for JSON serialization
        created_user["_id"] = str(created_user["_id"])
        created_user["id"] = str(created_user["_id"])  # Add id field for response model
        created_user["is_active"] = True  # Ensure is_active is set
        
        # Convert datetime objects to ISO format strings
        created_user["created_at"] = created_user["created_at"].isoformat()
        created_user["updated_at"] = created_user["updated_at"].isoformat()
        
        print("Registration successful")
        return created_user
        
    except HTTPException as he:
        print(f"HTTP Exception during registration: {str(he)}")
        raise he
    except Exception as e:
        print(f"Unexpected error during registration: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_database)):
    print(f"Login attempt for user: {form_data.email}")  # Debug log
    
    user = await db.user_profiles.find_one({"email": form_data.email})
    if not user:
        print(f"User not found: {form_data.email}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user["password"]):
        print(f"Invalid password for user: {form_data.email}")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await db.user_profiles.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    print(f"Login successful for user: {form_data.email}")  # Debug log
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
