from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, Any
from ..services.nutrition_service import NutritionService
from ..models import UserProfile
from ..auth import get_current_user
from .database import get_database as get_db
from sqlalchemy.orm import Session
import json
from datetime import datetime
from bson import ObjectId

router = APIRouter()
nutrition_service = NutritionService()

@router.post("/calculate-needs")
async def calculate_nutritional_needs(
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """
    Calculate nutritional needs for the current user
    """
    try:
        nutritional_plan = await nutrition_service.calculate_nutritional_needs(current_user)
        
        # Store the nutritional plan in the database
        await db.user_profiles.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"profile.nutritional_plan": nutritional_plan}}
        )
        
        return json.loads(nutritional_plan)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-meal")
async def analyze_meal_photo(
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Analyze a meal photo and return nutritional information
    """
    try:
        # TODO: Implement file upload to cloud storage and get URL
        # For now, we'll use a placeholder URL
        image_url = "placeholder_url"  # Replace with actual uploaded image URL
        
        meal_analysis = await nutrition_service.analyze_meal_photo(image_url)
        
        # Store the meal analysis in the database
        # TODO: Implement meal logging in database
        
        return json.loads(meal_analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/meals/{date}")
async def get_user_meals(
    date: str,
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get user's meals for a specific date.
    """
    try:
        # Parse the date
        meal_date = datetime.strptime(date, "%Y-%m-%d")
        
        # Query meals for the user and date
        meals = await db.meals.find({
            "user_id": ObjectId(current_user.id),
            "date": {
                "$gte": meal_date.replace(hour=0, minute=0, second=0),
                "$lt": meal_date.replace(hour=23, minute=59, second=59)
            }
        }).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for meal in meals:
            meal["id"] = str(meal["_id"])
            del meal["_id"]
            meal["user_id"] = str(meal["user_id"])
        
        # For now, return placeholder meals for testing
        placeholder_meals = [
            {
                "id": "meal1",
                "name": "Masala Oats Breakfast",
                "time": "8:30 AM",
                "image": "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80",
                "tags": ["High-Fiber", "Low-Sodium", "Plant-Based"],
                "macros": {
                    "calories": 320,
                    "protein": 12,
                    "carbs": 45,
                    "fats": 8,
                    "fiber": 6,
                    "sugar": 4,
                    "sodium": 180
                },
                "healthScores": {
                    "glycemic": 65,
                    "inflammatory": 25,
                    "heart": 90,
                    "digestive": 85,
                    "balance": 85
                }
            },
            {
                "id": "meal2",
                "name": "Tandoori Paneer Wrap",
                "time": "1:15 PM",
                "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&dpr=2&q=80",
                "tags": ["High-Protein", "Balanced-Meal", "Vegetarian"],
                "macros": {
                    "calories": 580,
                    "protein": 28,
                    "carbs": 65,
                    "fats": 22,
                    "fiber": 4,
                    "sugar": 8,
                    "sodium": 640
                },
                "healthScores": {
                    "glycemic": 70,
                    "inflammatory": 35,
                    "heart": 80,
                    "digestive": 75,
                    "balance": 85
                }
            },
            {
                "id": "meal3",
                "name": "Apple & Nut Butter Snack",
                "time": "4:00 PM",
                "image": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&dpr=2&q=80",
                "tags": ["Quick-Energy", "Heart-Healthy", "Low-Sodium"],
                "macros": {
                    "calories": 210,
                    "protein": 5,
                    "carbs": 25,
                    "fats": 12,
                    "fiber": 4,
                    "sugar": 18,
                    "sodium": 40
                },
                "healthScores": {
                    "glycemic": 50,
                    "inflammatory": 20,
                    "heart": 85,
                    "digestive": 80,
                    "balance": 75
                }
            },
            {
                "id": "meal4",
                "name": "Lentil Vegetable Curry & Rice",
                "time": "7:30 PM",
                "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&dpr=2&q=80",
                "tags": ["Protein-Rich", "Plant-Based", "Iron-Rich"],
                "macros": {
                    "calories": 620,
                    "protein": 24,
                    "carbs": 85,
                    "fats": 15,
                    "fiber": 10,
                    "sugar": 6,
                    "sodium": 580
                },
                "healthScores": {
                    "glycemic": 60,
                    "inflammatory": 30,
                    "heart": 90,
                    "digestive": 85,
                    "balance": 90
                }
            }
        ]
        
        return {"meals": placeholder_meals}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 