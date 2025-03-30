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
            print("\n=== Starting Nutritional Needs Calculation ===")
            print(f"Calculating needs for user: {user.email}")
            
            # Create a copy of profile data for logging
            profile_data = user_dict['profile'].copy()
            print(f"Profile data being sent to GPT: {json.dumps(profile_data, default=str)}")
            
            try:
                nutritional_needs = await calculate_nutritional_needs(user_dict["profile"])
                print(f"GPT-MINI generated nutritional needs: {json.dumps(nutritional_needs, default=str)}")
                user_dict["profile"]["nutritional_needs"] = nutritional_needs
            except Exception as calc_error:
                print(f"Error in GPT calculation: {str(calc_error)}")
                # Calculate basic needs using BMR formula as fallback
                weight = float(user_dict["profile"]["weight"]["value"])
                height = float(user_dict["profile"]["height"]["value"])
                age = int(user_dict["profile"]["age"])
                sex = user_dict["profile"]["sex"]
                activity_level = user_dict["profile"]["activity_level"]
                
                bmr = calculate_bmr(weight, height, age, sex)
                calories = calculate_calorie_target(bmr, activity_level)
                
                nutritional_needs = {
                    "calories": calories,
                    "macros": {
                        "protein": {
                            "min": round(weight * 1.6),
                            "max": round(weight * 2.2),
                            "unit": "g"
                        },
                        "carbs": {
                            "min": round(calories["min"] * 0.45 / 4),
                            "max": round(calories["max"] * 0.65 / 4),
                            "unit": "g"
                        },
                        "fats": {
                            "min": round(calories["min"] * 0.20 / 9),
                            "max": round(calories["max"] * 0.35 / 9),
                            "unit": "g"
                        }
                    },
                    "other_nutrients": {
                        "fiber": {
                            "min": 25,
                            "max": 30,
                            "unit": "g"
                        },
                        "sugar": {
                            "min": 0,
                            "max": 50,
                            "unit": "g"
                        },
                        "sodium": {
                            "min": 1500,
                            "max": 2300,
                            "unit": "mg"
                        }
                    }
                }
                print("Using fallback nutritional needs calculation")
                user_dict["profile"]["nutritional_needs"] = nutritional_needs
            
        except Exception as e:
            print(f"Critical error in nutritional needs calculation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process nutritional needs: {str(e)}"
            )
        
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
    """
    Login endpoint that accepts email as username and password.
    The OAuth2PasswordRequestForm uses 'username' field for the email address.
    """
    try:
        print("=== Starting Login Process ===")
        print(f"Received login request with username: {form_data.username}")
        
        # Debug: Print form data structure
        print("Form data received:", {
            "username": form_data.username,
            "password": "[REDACTED]",
            "grant_type": form_data.grant_type,
            "client_id": form_data.client_id,
            "client_secret": form_data.client_secret
        })
        
        # Find user by email
        user = await db.user_profiles.find_one({"email": form_data.username})
        if not user:
            print(f"User not found with email: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"User found with ID: {user.get('_id')}")
        
        # Verify password
        if not verify_password(form_data.password, user["password"]):
            print(f"Invalid password for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print("Password verified successfully")
        
        # Update last login
        try:
            await db.user_profiles.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            print("Last login timestamp updated")
        except Exception as e:
            print(f"Warning: Failed to update last_login: {str(e)}")
            # Continue with login even if last_login update fails
        
        # Create access token
        try:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(user["_id"])}, expires_delta=access_token_expires
            )
            print("Access token created successfully")
        except Exception as e:
            print(f"Error creating access token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create access token",
            )
        
        print("=== Login Process Completed Successfully ===")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException as he:
        print(f"HTTP Exception during login: {str(he)}")
        raise he
    except Exception as e:
        print(f"Unexpected error during login: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile/update")
async def update_profile(
    profile_data: dict,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        print("\n=== Starting Profile Update Process ===")
        print(f"Updating profile for user: {current_user.email}")
        
        # Calculate new nutritional needs based on updated profile
        try:
            print("\n=== Starting Nutritional Needs Recalculation ===")
            print(f"Calculating needs for updated profile: {json.dumps(profile_data['profile'], default=str)}")
            
            try:
                nutritional_needs = await calculate_nutritional_needs(profile_data["profile"])
                print(f"GPT-MINI generated nutritional needs: {json.dumps(nutritional_needs, default=str)}")
                profile_data["profile"]["nutritional_needs"] = nutritional_needs
            except Exception as calc_error:
                print(f"Error in GPT calculation: {str(calc_error)}")
                # Calculate basic needs using BMR formula as fallback
                weight = float(profile_data["profile"]["weight"]["value"])
                height = float(profile_data["profile"]["height"]["value"])
                age = int(profile_data["profile"]["age"])
                sex = profile_data["profile"]["sex"]
                activity_level = profile_data["profile"]["activity_level"]
                
                bmr = calculate_bmr(weight, height, age, sex)
                calories = calculate_calorie_target(bmr, activity_level)
                
                nutritional_needs = {
                    "calories": calories,
                    "macros": {
                        "protein": {
                            "min": round(weight * 1.6),
                            "max": round(weight * 2.2),
                            "unit": "g"
                        },
                        "carbs": {
                            "min": round(calories["min"] * 0.45 / 4),
                            "max": round(calories["max"] * 0.65 / 4),
                            "unit": "g"
                        },
                        "fats": {
                            "min": round(calories["min"] * 0.20 / 9),
                            "max": round(calories["max"] * 0.35 / 9),
                            "unit": "g"
                        }
                    },
                    "other_nutrients": {
                        "fiber": {
                            "min": 25,
                            "max": 30,
                            "unit": "g"
                        },
                        "sugar": {
                            "min": 0,
                            "max": 50,
                            "unit": "g"
                        },
                        "sodium": {
                            "min": 1500,
                            "max": 2300,
                            "unit": "mg"
                        }
                    }
                }
                print("Using fallback nutritional needs calculation")
                profile_data["profile"]["nutritional_needs"] = nutritional_needs
            
        except Exception as e:
            print(f"Critical error in nutritional needs calculation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process nutritional needs: {str(e)}"
            )
        
        # Update the user profile in the database
        result = await db.user_profiles.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": profile_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Profile not found or no changes made"
            )
        
        # Fetch the updated profile
        updated_profile = await db.user_profiles.find_one({"_id": ObjectId(current_user.id)})
        
        # Convert ObjectId to string for JSON serialization
        if updated_profile:
            updated_profile["id"] = str(updated_profile["_id"])
            del updated_profile["_id"]
            # Convert datetime objects to ISO format strings
            if "created_at" in updated_profile:
                updated_profile["created_at"] = updated_profile["created_at"].isoformat()
            if "updated_at" in updated_profile:
                updated_profile["updated_at"] = updated_profile["updated_at"].isoformat()
            if "last_login" in updated_profile:
                updated_profile["last_login"] = updated_profile["last_login"].isoformat()
            return updated_profile
        else:
            raise HTTPException(
                status_code=404,
                detail="Profile not found after update"
            )
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )
