from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from ..services.nutrition_service import NutritionService
from ..models import UserProfile, MealCreate, Meal
from ..auth import get_current_user
from ..utils.gpt import analyze_meal_image, analyze_meal_details
from ..utils.nutrition import calculate_meal_scores
from .database import get_database as get_db
from sqlalchemy.orm import Session
import json
from datetime import datetime
from bson import ObjectId
from ..utils.json_utils import json_dumps
import io
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..routes.database import with_retry
import logging

router = APIRouter()
nutrition_service = NutritionService()
logger = logging.getLogger(__name__)

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
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze a meal photo and return nutritional information
    """
    try:
        print("\n=== Starting Meal Photo Analysis ===")
        print(f"Received file: {file.filename}, content_type: {file.content_type}")
        
        # Read the image content
        image_content = await file.read()
        print(f"Read {len(image_content)} bytes from file")
        
        # Store the image in the database
        image_id = await db.images.insert_one({
            "user_id": ObjectId(current_user.id),
            "filename": file.filename,
            "content_type": file.content_type,
            "data": image_content,
            "uploaded_at": datetime.utcnow()
        })
        
        # Generate the image URL with the full path
        image_url = f"/images/{str(image_id.inserted_id)}"
        
        # Analyze the image using GPT-4 Vision
        print("Calling analyze_meal_image...")
        analysis = await analyze_meal_image(image_content)
        print("Successfully analyzed meal image")
        
        # Add the image URL to the analysis
        analysis["image_url"] = image_url
        
        return {
            "status": "success",
            "data": analysis
        }
    except Exception as e:
        print(f"Error in analyze_meal_photo endpoint: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze meal photo: {str(e)}"
        )

@router.get("/meals/{date}")
@with_retry(max_retries=3, delay=2)
async def get_user_meals(
    date: str,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
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
                "$gte": meal_date,
                "$lt": datetime(meal_date.year, meal_date.month, meal_date.day + 1)
            }
        }).sort("timestamp", -1).to_list(length=None)  # Sort by timestamp in descending order
        
        # Convert ObjectId to string for JSON serialization
        formatted_meals = []
        for meal in meals:
            try:
                # Ensure health scores have the correct structure
                scores = meal.get("scores", {})
                health_scores = {
                    "glycemic": scores.get("glycemic_index", 0),
                    "inflammatory": scores.get("inflammatory", 0),
                    "heart": scores.get("heart_health", 0),
                    "digestive": scores.get("digestive", 0),
                    "balance": scores.get("meal_balance", 0)
                }
                
                # Format the meal data to match the frontend's expected structure
                formatted_meal = {
                    "id": str(meal.get("_id", "")),
                    "name": meal.get("meal_name", "Analyzed Meal"),
                    "time": meal.get("timestamp", datetime.utcnow()).strftime("%I:%M %p"),
                    "image": meal.get("image_url", ""),
                    "tags": meal.get("health_tags", []),
                    "macros": meal.get("macronutrients", {}),
                    "healthScores": health_scores
                }
                formatted_meals.append(formatted_meal)
            except Exception as e:
                print(f"Error formatting meal {meal.get('_id')}: {str(e)}")
                continue
        
        return {"meals": formatted_meals}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error in get_user_meals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-details")
async def analyze_meal_details_endpoint(
    data: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze meal details based on conversation history and user profile.
    """
    try:
        print("\n=== Starting Meal Details Analysis ===")
        print(f"Received data: {json_dumps(data, indent=2)}")
        
        conversation_history = data.get("conversation_history", [])
        user_profile = data.get("user_profile", {})
        
        print("Getting detailed analysis from GPT...")
        # Get detailed analysis
        analysis = await analyze_meal_details(conversation_history, user_profile)
        print(f"Received analysis: {json_dumps(analysis, indent=2)}")
        
        print("Calculating nutritional scores...")
        # Calculate nutritional scores
        scores = calculate_meal_scores(analysis)
        analysis["health_scores"] = scores
        print(f"Calculated scores: {json_dumps(scores, indent=2)}")
        
        # Extract image URL from the analysis if it exists
        image_url = analysis.get("image_url", "")
        
        # Create meal entry
        meal_entry = {
            "user_id": ObjectId(current_user.id),
            "timestamp": datetime.utcnow(),
            "date": datetime.utcnow().strftime("%Y-%m-%d"),  # Convert date to string format
            "image_url": analysis.get("image_url") or "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80",  # Use default image if none provided
            "meal_name": analysis.get("meal_name", "Analyzed Meal"),
            "ingredients": analysis.get("ingredients", []),
            "cooking_method": analysis.get("cooking_method", ""),
            "serving_size": analysis.get("serving_size", ""),
            "macronutrients": {
                "calories": analysis.get("calories", 0),
                "protein": analysis.get("protein", 0),
                "carbs": analysis.get("carbs", 0),
                "fats": analysis.get("fats", 0),
                "fiber": analysis.get("fiber", 0),
                "sugar": analysis.get("sugar", 0),
                "sodium": analysis.get("sodium", 0)
            },
            "scores": scores,
            "health_tags": analysis.get("health_tags", []),
            "suggestions": analysis.get("suggestions", []),
            "recommended_recipes": analysis.get("recommended_recipes", [])
        }
        
        print("Storing meal entry in database...")
        # Store meal entry in database
        result = await db.meals.insert_one(meal_entry)
        
        # Create a copy of meal_entry for response
        response_data = meal_entry.copy()
        
        # Convert ObjectId to string for response
        response_data["id"] = str(result.inserted_id)
        response_data["user_id"] = str(response_data["user_id"])
        
        # Convert timestamp to ISO format string
        response_data["timestamp"] = response_data["timestamp"].isoformat()
        
        print(f"Successfully stored meal with ID: {response_data['id']}")
        
        # Use json_dumps to ensure proper serialization of the entire response
        return json.loads(json_dumps({
            "status": "success",
            "data": response_data
        }))
        
    except Exception as e:
        print("\n=== Error in analyze_meal_details_endpoint ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No additional details'}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze meal details: {str(e)}"
        )

@router.get("/images/{image_id}")
async def get_image(
    image_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get a stored image by ID
    """
    try:
        print(f"\n=== Getting Image {image_id} ===")
        
        # Find the image in the database
        image = await db.images.find_one({"_id": ObjectId(image_id)})
        if not image:
            print(f"Image not found: {image_id}")
            raise HTTPException(status_code=404, detail="Image not found")
            
        # Check if the image belongs to the current user
        if str(image["user_id"]) != current_user.id:
            print(f"User {current_user.id} not authorized to access image {image_id}")
            raise HTTPException(status_code=403, detail="Not authorized to access this image")
            
        print(f"Found image: {image['filename']}, content_type: {image['content_type']}")
        
        # Create a streaming response with the image data
        return StreamingResponse(
            io.BytesIO(image["data"]),
            media_type=image["content_type"],
            headers={
                "Content-Disposition": f"inline; filename={image['filename']}"
            }
        )
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/meals")
@with_retry(max_retries=3, delay=2)
async def create_meal(
    meal: MealCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        meal_dict = meal.dict()
        meal_dict["user_id"] = current_user["id"]
        meal_dict["date"] = datetime.now()
        
        result = await db.meals.insert_one(meal_dict)
        
        # Fetch the created meal
        created_meal = await db.meals.find_one({"_id": result.inserted_id})
        created_meal["_id"] = str(created_meal["_id"])
        created_meal["user_id"] = str(created_meal["user_id"])
        
        return created_meal
    except Exception as e:
        logger.error(f"Error creating meal: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create meal: {str(e)}"
        )

@router.put("/meals/{meal_id}")
@with_retry(max_retries=3, delay=2)
async def update_meal(
    meal_id: str,
    meal: MealCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        meal_dict = meal.dict()
        meal_dict["user_id"] = current_user["id"]
        
        result = await db.meals.update_one(
            {"_id": ObjectId(meal_id), "user_id": current_user["id"]},
            {"$set": meal_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Meal not found or no changes made"
            )
        
        # Fetch the updated meal
        updated_meal = await db.meals.find_one({"_id": ObjectId(meal_id)})
        updated_meal["_id"] = str(updated_meal["_id"])
        updated_meal["user_id"] = str(updated_meal["user_id"])
        
        return updated_meal
    except Exception as e:
        logger.error(f"Error updating meal: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update meal: {str(e)}"
        )

@router.delete("/meals/{meal_id}")
@with_retry(max_retries=3, delay=2)
async def delete_meal(
    meal_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        result = await db.meals.delete_one({
            "_id": ObjectId(meal_id),
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Meal not found"
            )
        
        return {"message": "Meal deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting meal: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete meal: {str(e)}"
        ) 