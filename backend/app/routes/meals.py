from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.models import User
from app.auth import get_current_user
from app.utils.gpt import analyze_meal_image, analyze_meal_details
from app.utils.nutrition import calculate_meal_scores
from datetime import datetime
from typing import List, Dict, Any
import json
from app.database import get_db
from bson import ObjectId

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
        
        # Do NOT create or store a meal entry here
        return {
            "status": "success",
            "data": analysis
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze meal details: {str(e)}"
        )

@router.delete("/meals/{meal_id}")
async def delete_meal(
    meal_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a meal from the database.
    """
    try:
        db = get_db()
        
        # Convert string ID to ObjectId
        try:
            meal_object_id = ObjectId(meal_id)
        except:
            raise HTTPException(
                status_code=400,
                detail="Invalid meal ID format"
            )
        
        # Find and delete the meal
        result = await db.meals.delete_one({
            "_id": meal_object_id,
            "user_id": current_user.id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Meal not found or you don't have permission to delete it"
            )
        
        return {
            "status": "success",
            "message": "Meal deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete meal: {str(e)}"
        ) 