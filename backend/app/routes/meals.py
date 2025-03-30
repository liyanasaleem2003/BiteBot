from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.models import User
from app.auth import get_current_user
from app.utils.gpt import analyze_meal_image, analyze_meal_details
from app.utils.nutrition import calculate_meal_scores
from datetime import datetime
from typing import List, Dict, Any
import json
from app.database import get_db

router = APIRouter()

@router.post("/analyze-meal")
async def analyze_meal(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze a meal image and detect ingredients.
    """
    try:
        # Read image file
        image_content = await image.read()
        
        # Analyze image with GPT-4.0 Vision
        analysis = await analyze_meal_image(image_content)
        
        return {
            "status": "success",
            "data": analysis
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze meal: {str(e)}"
        )

@router.post("/analyze-details")
async def analyze_meal_details_endpoint(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Analyze meal details based on conversation history and user profile.
    """
    try:
        conversation_history = data.get("conversation_history", [])
        user_profile = data.get("user_profile", {})
        
        # Get detailed analysis
        analysis = await analyze_meal_details(conversation_history, user_profile)
        
        # Calculate nutritional scores
        scores = calculate_meal_scores(analysis)
        analysis["health_scores"] = scores
        
        # Create meal entry
        meal_entry = {
            "user_id": current_user.id,
            "timestamp": datetime.utcnow(),
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "image_url": data.get("image_url", ""),
            "meal_name": analysis.get("meal_name", "Analyzed Meal"),
            "ingredients": analysis["ingredients"],
            "cooking_method": analysis["cooking_method"],
            "serving_size": analysis["serving_size"],
            "macronutrients": {
                "calories": analysis["calories"],
                "protein": analysis["protein"],
                "carbs": analysis["carbs"],
                "fats": analysis["fats"],
                "fiber": analysis["fiber"],
                "sugar": analysis["sugar"],
                "sodium": analysis["sodium"]
            },
            "scores": scores,
            "health_tags": analysis["health_tags"],
            "suggestions": analysis["suggestions"],
            "recommended_recipes": analysis["recommended_recipes"]
        }
        
        # Store meal entry in database
        db = get_db()
        result = await db.meals.insert_one(meal_entry)
        meal_entry["id"] = str(result.inserted_id)
        
        return {
            "status": "success",
            "data": meal_entry
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze meal details: {str(e)}"
        ) 