from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Body
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from datetime import datetime
from ..services.nutrition_service import NutritionService
from ..models import UserProfile, MealCreate, Meal
from ..auth import get_current_user
from ..utils.gpt import analyze_meal_image, analyze_meal_details
from ..utils.nutrition import calculate_meal_scores
from ..utils.json_utils import json_dumps, json_loads
from .database import get_database as get_db
from sqlalchemy.orm import Session
import json
from datetime import datetime, timedelta
from bson import ObjectId
import io
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..routes.database import with_retry
import logging
from ..config import settings

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
        image_url = f"{settings.API_BASE_URL}/images/{str(image_id.inserted_id)}"
        
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
        logger.info(f"Fetching meals for user {current_user.id} on date {date}")
        
        # Validate date format
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Query the database for meals
        meals_cursor = db.meals.find({
            "user_id": str(current_user.id),
            "date": date
        }).sort("timestamp", -1)  # Sort by timestamp descending (newest first)
        
        meals = await meals_cursor.to_list(length=100)
        logger.info(f"Found {len(meals)} meals for user {current_user.id} on date {date}")
        
        # Format the meals for the frontend
        formatted_meals = []
        for meal in meals:
            try:
                # Convert ObjectId to string for JSON serialization
                meal["id"] = str(meal["_id"])
                
                # Format the meal data
                formatted_meal = {
                    "id": meal["id"],
                    "meal_name": meal.get("meal_name", "Unnamed Meal"),
                    "date": meal.get("date", date),
                    "timestamp": meal.get("timestamp", datetime.utcnow().isoformat()),
                    "image_url": meal.get("image_url", ""),
                    "ingredients": meal.get("ingredients", []),
                    "cooking_method": meal.get("cooking_method", ""),
                    "serving_size": meal.get("serving_size", ""),
                    "macronutrients": meal.get("macronutrients", {}),
                    "scores": meal.get("scores", {}),
                    "health_tags": meal.get("health_tags", []),
                    "suggestions": meal.get("suggestions", []),
                    "recommended_recipes": meal.get("recommended_recipes", []),
                    "health_benefits": meal.get("health_benefits", []),
                    "potential_concerns": meal.get("potential_concerns", []),
                }
                
                # Ensure micronutrient_balance is properly formatted
                micronutrient_balance = meal.get("micronutrient_balance", {})
                if not micronutrient_balance:
                    micronutrient_balance = {
                        "score": 0,
                        "priority_nutrients": []
                    }
                elif isinstance(micronutrient_balance, dict):
                    # Make sure it has the required fields
                    if "score" not in micronutrient_balance:
                        micronutrient_balance["score"] = 0
                    if "priority_nutrients" not in micronutrient_balance:
                        micronutrient_balance["priority_nutrients"] = []
                
                formatted_meal["micronutrient_balance"] = micronutrient_balance
                formatted_meals.append(formatted_meal)
            except Exception as e:
                logger.error(f"Error formatting meal {meal.get('_id')}: {str(e)}")
                continue
        
        return {"meals": formatted_meals}
        
    except Exception as e:
        logger.error(f"Error in get_user_meals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-details")
async def analyze_meal_details_endpoint(
    data: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Analyze meal details based on conversation history and user profile.
    """
    try:
        logger.info("=== Starting Meal Details Analysis ===")
        
        # Extract conversation history and user profile
        conversation_history = data.get("conversation_history", [])
        user_profile = data.get("user_profile", {})
        
        # Analyze meal details using GPT
        analysis = await analyze_meal_details(conversation_history, user_profile)
        
        # Process the analysis data to ensure all required fields are present
        # Make sure macronutrients is properly structured
        if "macronutrients" not in analysis or not analysis["macronutrients"]:
            analysis["macronutrients"] = {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "fiber": 0,
                "sugar": 0,
                "sodium": 0
            }
        
        # Make sure micronutrients is properly structured
        if "micronutrients" not in analysis or not analysis["micronutrients"]:
            analysis["micronutrients"] = {
                "vitamin_a": {"percentage_of_daily": 0},
                "vitamin_c": {"percentage_of_daily": 0},
                "vitamin_d": {"percentage_of_daily": 0},
                "vitamin_e": {"percentage_of_daily": 0},
                "vitamin_k": {"percentage_of_daily": 0},
                "vitamin_b1": {"percentage_of_daily": 0},
                "vitamin_b2": {"percentage_of_daily": 0},
                "vitamin_b3": {"percentage_of_daily": 0},
                "vitamin_b6": {"percentage_of_daily": 0},
                "vitamin_b12": {"percentage_of_daily": 0},
                "folate": {"percentage_of_daily": 0},
                "calcium": {"percentage_of_daily": 0},
                "iron": {"percentage_of_daily": 0},
                "magnesium": {"percentage_of_daily": 0},
                "phosphorus": {"percentage_of_daily": 0},
                "potassium": {"percentage_of_daily": 0},
                "zinc": {"percentage_of_daily": 0},
                "copper": {"percentage_of_daily": 0},
                "manganese": {"percentage_of_daily": 0},
                "selenium": {"percentage_of_daily": 0},
                "chromium": {"percentage_of_daily": 0},
                "iodine": {"percentage_of_daily": 0}
            }
        
        # Calculate nutritional scores
        scores = calculate_meal_scores(analysis)
        analysis["scores"] = scores
        
        # Ensure we have a meal name
        if not analysis.get("meal_name"):
            # Try to extract a meal name from the conversation
            meal_name = extract_meal_name_from_conversation(conversation_history)
            if meal_name:
                analysis["meal_name"] = meal_name
            else:
                analysis["meal_name"] = "Analyzed Meal"
        
        # Log the meal name for debugging
        logger.info(f"Meal name from analysis: {analysis.get('meal_name', 'Not provided')}")
        
        # Extract image URL from the analysis if it exists
        image_url = analysis.get("image_url", "")
        
        # Create meal entry
        meal_entry = {
            "user_id": str(current_user.id),  # Convert ObjectId to string
            "timestamp": datetime.utcnow(),
            "date": datetime.utcnow().strftime("%Y-%m-%d"),  # Convert date to string format
            "image_url": analysis.get("image_url") or "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80",  # Use default image if none provided
            "meal_name": analysis.get("meal_name", "Analyzed Meal"),
            "ingredients": analysis.get("ingredients", []),
            "cooking_method": analysis.get("cooking_method", ""),
            "serving_size": analysis.get("serving_size", ""),
            "macronutrients": analysis.get("macronutrients", {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "fiber": 0,
                "sugar": 0,
                "sodium": 0
            }),
            "micronutrients": analysis.get("micronutrients", {}),
            "scores": {
                "glycemic_index": scores.get("glycemic_index", 0),
                "inflammatory": scores.get("inflammatory", 0),
                "heart_health": scores.get("heart_health", 0),
                "digestive": scores.get("digestive", 0),
                "meal_balance": scores.get("meal_balance", 0),
                "micronutrient_balance": scores.get("micronutrient_balance", 0)
            },
            "individual_micronutrients": scores.get("individual_micronutrients", {}),
            "health_tags": analysis.get("health_tags", []),
            "suggestions": analysis.get("suggestions", []),
            "recommended_recipes": analysis.get("recommended_recipes", []),
            "health_benefits": analysis.get("health_benefits", []),
            "potential_concerns": analysis.get("potential_concerns", []),
            "micronutrient_balance": analysis.get("micronutrient_balance", {})
        }
        
        logger.info("Storing meal entry in database...")
        # Store meal entry in database
        result = await db.meals.insert_one(meal_entry)
        
        # Create a copy of meal_entry for response
        response_data = meal_entry.copy()
        
        # Convert ObjectId to string for response
        response_data["id"] = str(result.inserted_id)
        
        # Convert timestamp to ISO format string
        response_data["timestamp"] = response_data["timestamp"].isoformat()
        
        logger.info(f"Successfully stored meal with ID: {response_data['id']}")
        
        # Format the response using the enhanced JSON serialization 
        response = {
            "status": "success",
            "data": response_data
        }
        
        # Use the enhanced JSON serialization utility to handle ObjectId objects
        serialized_response = json_loads(json_dumps(response))
        return serialized_response
        
    except Exception as e:
        logger.error(f"Error in analyze_meal_details_endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze meal details: {str(e)}"
        )

def extract_meal_name_from_conversation(conversation_history):
    """Extract a potential meal name from the conversation history"""
    meal_keywords = ["eating", "had", "ate", "having", "consumed", "meal", "breakfast", "lunch", "dinner", "snack"]
    
    for message in conversation_history:
        if message.get("type") == "user":
            content = message.get("content", "").lower()
            
            # Check if the message contains meal keywords
            if any(keyword in content for keyword in meal_keywords):
                # Extract potential meal name (simple heuristic)
                words = content.split()
                for i, word in enumerate(words):
                    if word in meal_keywords and i + 1 < len(words):
                        # Get 4-5 words after the meal keyword
                        start_idx = i + 1
                        end_idx = min(start_idx + 5, len(words))  # Get up to 5 words
                        potential_name = " ".join(words[start_idx:end_idx])
                        
                        # If we got less than 4 words, try to get more context
                        if len(potential_name.split()) < 4:
                            # Look for more words before the meal keyword
                            pre_words = words[max(0, i-2):i]  # Get up to 2 words before
                            potential_name = " ".join(pre_words + [word] + words[start_idx:end_idx])
                        
                        # Capitalize words and limit to 5 words
                        name_parts = potential_name.split()[:5]
                        return " ".join(word.capitalize() for word in name_parts)
    
    return None

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
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        logger.info(f"Creating meal for user {current_user.id}")
        
        # Convert the meal model to a dictionary
        meal_dict = meal.dict(by_alias=False)
        
        # Add user_id and ensure date is in the correct format
        meal_dict["user_id"] = str(current_user.id)
        if "date" not in meal_dict or not meal_dict["date"]:
            meal_dict["date"] = datetime.utcnow().strftime("%Y-%m-%d")
            
        # Convert timestamp to string for consistent serialization
        if "timestamp" in meal_dict and isinstance(meal_dict["timestamp"], datetime):
            meal_dict["timestamp"] = meal_dict["timestamp"].isoformat()
        
        # Ensure micronutrient_balance is properly formatted
        if "micronutrient_balance" not in meal_dict or not meal_dict["micronutrient_balance"]:
            meal_dict["micronutrient_balance"] = {
                "score": 0,
                "priority_nutrients": []
            }
        elif isinstance(meal_dict["micronutrient_balance"], dict):
            # Make sure it has the required fields
            if "score" not in meal_dict["micronutrient_balance"]:
                meal_dict["micronutrient_balance"]["score"] = 0
            if "priority_nutrients" not in meal_dict["micronutrient_balance"]:
                meal_dict["micronutrient_balance"]["priority_nutrients"] = []
        
        # Ensure image_url is properly set
        if "image_url" not in meal_dict or not meal_dict["image_url"]:
            # Try to get image_url from the analysis if available
            if "analysis" in meal_dict and isinstance(meal_dict["analysis"], dict):
                meal_dict["image_url"] = meal_dict["analysis"].get("image_url", "")
            else:
                # Use a default image if no image URL is provided
                meal_dict["image_url"] = "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80"
        
        logger.info(f"Meal data: {meal_dict}")
        
        # Insert the meal into the database
        result = await db.meals.insert_one(meal_dict)
        
        # Fetch the created meal
        created_meal = await db.meals.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string for JSON serialization
        created_meal["id"] = str(created_meal["_id"])
        del created_meal["_id"]
        
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
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete a meal by its ID for the current user.
    """
    try:
        logger.info(f"Deleting meal {meal_id} for user {current_user.id}")
        
        # Check if the meal exists and belongs to the current user
        meal = await db.meals.find_one({
            "_id": ObjectId(meal_id),
            "user_id": str(current_user.id)
        })
        
        if not meal:
            logger.warning(f"Meal {meal_id} not found or does not belong to user {current_user.id}")
            raise HTTPException(
                status_code=404,
                detail="Meal not found or you don't have permission to delete it"
            )
        
        # Delete the meal
        result = await db.meals.delete_one({
            "_id": ObjectId(meal_id),
            "user_id": str(current_user.id)
        })
        
        if result.deleted_count == 0:
            logger.warning(f"Failed to delete meal {meal_id}")
            raise HTTPException(
                status_code=500,
                detail="Failed to delete meal"
            )
        
        logger.info(f"Successfully deleted meal {meal_id}")
        return {"message": "Meal deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting meal: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete meal: {str(e)}"
        )

@router.post("/recipe-recommendations")
async def get_recipe_recommendations(
    data: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get recipe recommendations based on meal analysis.
    """
    try:
        meal_analysis = data.get("meal_analysis", {})
        if not meal_analysis:
            raise HTTPException(status_code=400, detail="Meal analysis data is required")

        # Get health tags from meal analysis and normalize them
        health_tags = meal_analysis.get("health_tags", [])
        normalized_tags = []
        
        # Mapping of common variations to standardized format
        tag_mapping = {
            "Heart healthy": "Heart-Healthy",
            "Energy enhancing": "High-Protein",
            "Gut friendly": "Digestive Health",
            "Low sugar": "Low-Sugar",
            "High protein": "High-Protein",
            "Immunity boosting": "Immunity Boosting",
            "Skin health": "Skin & Joint Health",
            "Iron rich": "Iron & Folate Rich"
        }
        
        # Normalize each tag
        for tag in health_tags:
            normalized_tag = tag_mapping.get(tag, tag)
            # Convert to proper format if not in mapping
            if normalized_tag == tag:
                # Convert to title case and replace spaces with hyphens
                normalized_tag = "-".join(word.capitalize() for word in tag.split())
            normalized_tags.append(normalized_tag)
        
        logger.info(f"Normalized health tags: {normalized_tags}")
        
        # Query recipes collection for recommendations
        recipes_cursor = db.recipes.find(
            {
                "tags.health_goal": {
                    "$elemMatch": {
                        "main": {"$in": normalized_tags}
                    }
                }
            },
            {"_id": 0}
        ).limit(3)  # Limit to 3 recommendations
        
        recipes = await recipes_cursor.to_list(length=None)
        logger.info(f"Found {len(recipes)} matching recipes")
        
        # Format recipes for response
        formatted_recipes = []
        for recipe in recipes:
            formatted_recipe = {
                "name": recipe["name"],
                "description": recipe.get("introduction", ""),
                "ingredients": [ing["name"] for ing in recipe.get("ingredients", [])],
                "benefits": ", ".join([
                    sub for goal in recipe.get("tags", {}).get("health_goal", [])
                    for sub in goal.get("sub", [])
                ])
            }
            formatted_recipes.append(formatted_recipe)
        
        # If no recipes found, try a more lenient search
        if not formatted_recipes:
            logger.info("No exact matches found, trying more lenient search")
            recipes_cursor = db.recipes.find(
                {
                    "tags.health_goal": {
                        "$elemMatch": {
                            "main": {"$regex": "|".join(normalized_tags), "$options": "i"}
                        }
                    }
                },
                {"_id": 0}
            ).limit(3)
            
            recipes = await recipes_cursor.to_list(length=None)
            logger.info(f"Found {len(recipes)} recipes in lenient search")
            
            for recipe in recipes:
                formatted_recipe = {
                    "name": recipe["name"],
                    "description": recipe.get("introduction", ""),
                    "ingredients": [ing["name"] for ing in recipe.get("ingredients", [])],
                    "benefits": ", ".join([
                        sub for goal in recipe.get("tags", {}).get("health_goal", [])
                        for sub in goal.get("sub", [])
                    ])
                }
                formatted_recipes.append(formatted_recipe)
        
        return {"recipes": formatted_recipes}
        
    except Exception as e:
        logger.error(f"Error in get_recipe_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))