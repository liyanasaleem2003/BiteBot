from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Body
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from datetime import datetime
from ..services.nutrition_service import NutritionService
from ..models import UserProfile, MealCreate, Meal
from ..auth import get_current_user
from ..utils.gpt import analyze_meal_image, analyze_meal_details, query_gpt
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
import traceback
from PIL import Image
import base64

router = APIRouter()
nutrition_service = NutritionService()
logger = logging.getLogger(__name__)

def compress_image(image_content: bytes, max_size_mb: float = 0.6) -> bytes:
    """
    Compress an image to be under 600KB while maintaining quality.
    Returns the compressed image as bytes.
    """
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_content))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Calculate target size in bytes (600KB)
        max_size_bytes = max_size_mb * 1024 * 1024
        
        # Start with high quality
        quality = 85  # Start with slightly lower quality for faster compression
        output = io.BytesIO()
        
        # Compress with decreasing quality until size is under max_size_bytes
        while quality > 5:
            output.seek(0)
            output.truncate()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            if output.tell() <= max_size_bytes:
                break
            quality -= 10  # Decrease quality more aggressively
        
        # If still too large, resize the image
        if output.tell() > max_size_bytes:
            # Calculate new dimensions while maintaining aspect ratio
            ratio = (max_size_bytes / output.tell()) ** 0.5
            new_width = int(image.width * ratio)
            new_height = int(image.height * ratio)
            
            # Resize image
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save with optimized settings
            output.seek(0)
            output.truncate()
            image.save(output, format='JPEG', quality=85, optimize=True)
            
            # If still too large, try one more time with lower quality
            if output.tell() > max_size_bytes:
                output.seek(0)
                output.truncate()
                image.save(output, format='JPEG', quality=75, optimize=True)
        
        compressed_size = output.tell()
        print(f"Compressed image to {compressed_size/1024:.1f}KB with quality {quality}")
        return output.getvalue()
        
    except Exception as e:
        logger.error(f"Error compressing image: {str(e)}")
        # If compression fails, return original image
        return image_content

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
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze a meal photo and return nutritional information
    """
    try:
        print("\n=== Starting Meal Photo Analysis ===")
        print(f"Received file: {file.filename}, content_type: {file.content_type}")
        print(f"API_BASE_URL: {settings.API_BASE_URL}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=422,
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read the image content
        image_content = await file.read()
        print(f"Read {len(image_content)} bytes from file")
        
        # Validate file size (max 5MB)
        if len(image_content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=422,
                detail="File size too large. Maximum size is 5MB."
            )
        
        # Compress the image before storing
        compressed_image = compress_image(image_content)
        print(f"Compressed image from {len(image_content)} to {len(compressed_image)} bytes")
        
        # Store the compressed image in the database
        image_id = await db.images.insert_one({
            "user_id": ObjectId(current_user.id),
            "filename": file.filename,
            "content_type": "image/jpeg",  # Always store as JPEG after compression
            "data": compressed_image,
            "uploaded_at": datetime.utcnow()
        })
        
        # Generate the image URL with the full path
        image_url = f"{settings.API_BASE_URL}/api/nutrition/images/{str(image_id.inserted_id)}"
        print(f"Generated image URL: {image_url}")
        print(f"Image ID: {str(image_id.inserted_id)}")

        # Analyze the image using GPT-4 Vision
        print("Calling analyze_meal_image...")
        analysis = await analyze_meal_image(image_content)  # Use original image for analysis
        print("Successfully analyzed meal image")
        
        # Add the image URL to the analysis
        analysis["image_url"] = image_url
        print(f"Final analysis with image URL: {analysis}")
        
        return {
            "status": "success",
            "data": analysis
        }
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Error in analyze_meal_photo endpoint: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {str(e)}")
        print(f"Stack trace: {traceback.format_exc()}")
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
        
        logger.info(f"Received conversation history: {json.dumps(conversation_history, indent=2)}")
        logger.info(f"Received user profile: {json.dumps(user_profile, indent=2)}")
        
        # Get user's priority micronutrients from their profile
        priority_micronutrients = user_profile.get('profile', {}).get('priority_micronutrients', [])
        logger.info(f"Priority micronutrients: {priority_micronutrients}")
        
        # Analyze meal details using GPT
        try:
            analysis = await analyze_meal_details(conversation_history, user_profile)
            logger.info(f"GPT analysis completed: {json.dumps(analysis, indent=2)}")
        except Exception as gpt_error:
            logger.error(f"Error in GPT analysis: {str(gpt_error)}")
            logger.error(f"GPT error type: {type(gpt_error)}")
            logger.error(f"GPT error traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to analyze meal with GPT: {str(gpt_error)}"
            )
        
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
        
        # Only track the user's selected priority micronutrients
        if "micronutrients" not in analysis or not analysis["micronutrients"]:
            analysis["micronutrients"] = {}
        
        # Filter micronutrients to only include priority ones
        filtered_micronutrients = {}
        for nutrient in priority_micronutrients:
            # Convert to snake_case for consistency
            nutrient_key = nutrient.lower().replace(" ", "_")
            if nutrient_key in analysis.get("micronutrients", {}):
                filtered_micronutrients[nutrient_key] = analysis["micronutrients"][nutrient_key]
        
        analysis["micronutrients"] = filtered_micronutrients
        
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
        
        # Do NOT create or store a meal entry here
        return {
            "status": "success",
            "data": analysis
        }
        
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
        print(f"User ID: {current_user.id}")
        print(f"Database connection: {db is not None}")
        
        # Find the image in the database
        print(f"Searching for image with ID: {image_id}")
        image = await db.images.find_one({"_id": ObjectId(image_id)})
        
        if not image:
            print(f"Image not found in database: {image_id}")
            raise HTTPException(status_code=404, detail="Image not found")
            
        print(f"Found image document: {image.keys()}")
        
        # Check if the image belongs to the current user
        if str(image["user_id"]) != current_user.id:
            print(f"User {current_user.id} not authorized to access image {image_id}")
            print(f"Image belongs to user: {image['user_id']}")
            raise HTTPException(status_code=403, detail="Not authorized to access this image")
            
        print(f"Found image: {image['filename']}, content_type: {image['content_type']}")
        print(f"Image size: {len(image['data'])} bytes")
        
        # Create a streaming response with the image data
        response = StreamingResponse(
            io.BytesIO(image["data"]),
            media_type=image["content_type"],
            headers={
                "Content-Disposition": f"inline; filename={image['filename']}",
                "Cache-Control": "public, max-age=31536000"
            }
        )
        print("Created streaming response")
        return response
        
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {str(e)}")
        print(f"Stack trace: {traceback.format_exc()}")
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
        
        # --- Add logic to delete the associated chat history entry ---
        chat_delete_result = await db.chat_history.delete_one({
            "meal_id": meal_id,  # Assuming chat history stores meal_id
            "user_id": str(current_user.id)
        })
        
        if chat_delete_result.deleted_count > 0:
            logger.info(f"Successfully deleted associated chat history for meal {meal_id}")
        else:
            logger.warning(f"No associated chat history found for meal {meal_id}")
        # --- End of added logic ---
        
        return {"message": "Meal and associated chat deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting meal: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete meal: {str(e)}"
        )

@router.post("/recipe-recommendations")
async def get_recipe_recommendations(
    request: Dict[str, Any] = Body(...),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get recipe recommendations based on user's profile preferences (health goals, dietary restrictions).
    """
    try:
        logger.info("=== Starting Recipe Recommendations Request ===")
        logger.info(f"Current user: {current_user}")
        logger.info(f"Request body: {request}")
        
        # Get user profile and meal analysis from request body
        user_profile = request.get("user_profile", {})
        meal_analysis = request.get("meal_analysis", {})
        
        logger.info(f"User profile from request: {user_profile}")
        logger.info(f"Meal analysis from request: {meal_analysis}")
        
        # Validate required data
        if not meal_analysis:
            logger.error("Meal analysis data is missing")
            raise HTTPException(status_code=400, detail="Meal analysis data is required")
        
        # Extract user preferences and health goals
        profile_data = user_profile.get('profile', {})
        dietary_preferences = profile_data.get('dietary_preferences', [])
        health_goals = profile_data.get('health_goals', [])
        cultural_preferences = profile_data.get('cultural_preferences', [])
        
        # Extract meal analysis data
        meal_macros = meal_analysis.get('macronutrients', {})
        meal_health_tags = meal_analysis.get('health_tags', [])
        meal_scores = meal_analysis.get('scores', {})
        
        # Try to get recipes from MongoDB first
        try:
            recipes_cursor = db.recipes.find({})
            all_recipes = await recipes_cursor.to_list(length=100)
            
            if not all_recipes:
                logger.warning("No recipes found in database, using hardcoded recipes")
                raise Exception("No recipes found in database")
                
        except Exception as e:
            logger.error(f"Error fetching recipes from database: {str(e)}")
            logger.info("Falling back to hardcoded recipes")
            # Fallback to hardcoded recipes
            all_recipes = [
                {
                    "name": "Quinoa Buddha Bowl",
                    "description": "A nourishing bowl packed with protein-rich quinoa, roasted vegetables, and a tahini dressing. Perfect for a healthy lunch or dinner.",
                    "ingredients": [
                        "1 cup quinoa",
                        "2 cups mixed vegetables (sweet potato, broccoli, bell peppers)",
                        "1 can chickpeas",
                        "2 tbsp tahini",
                        "1 lemon",
                        "2 tbsp olive oil",
                        "Salt and pepper to taste"
                    ],
                    "benefits": [
                        "High in plant-based protein",
                        "Rich in fiber",
                        "Supports digestive health",
                        "Anti-inflammatory properties"
                    ],
                    "tags": {
                        "dietary_preferences": ["Vegetarian", "Vegan", "Gluten-Free"],
                        "health_goal": [
                            {"main": "High-Protein", "sub": ["Plant-Based"]},
                            {"main": "Digestive Health", "sub": ["High-Fiber"]}
                        ],
                        "cultural": {"main": "Fusion", "sub": "Modern"}
                    },
                    "nutritional_info": {
                        "calories": 450,
                        "protein": 15,
                        "carbs": 60,
                        "fats": 18,
                        "fiber": 12
                    }
                },
                {
                    "name": "Mediterranean Salmon",
                    "description": "Grilled salmon with Mediterranean herbs, served with a fresh Greek salad and whole grain couscous.",
                    "ingredients": [
                        "2 salmon fillets",
                        "2 tbsp olive oil",
                        "1 lemon",
                        "Fresh herbs (oregano, thyme)",
                        "1 cup whole grain couscous",
                        "Mixed salad greens",
                        "Cherry tomatoes",
                        "Cucumber",
                        "Feta cheese"
                    ],
                    "benefits": [
                        "Rich in omega-3 fatty acids",
                        "Supports heart health",
                        "High in protein",
                        "Anti-inflammatory properties"
                    ],
                    "tags": {
                        "dietary_preferences": ["Non-Vegetarian", "Pescatarian"],
                        "health_goal": [
                            {"main": "Heart-Healthy", "sub": ["Omega-3 Rich"]},
                            {"main": "High-Protein", "sub": ["Muscle-Building"]}
                        ],
                        "cultural": {"main": "Authentic", "sub": "Mediterranean"}
                    },
                    "nutritional_info": {
                        "calories": 550,
                        "protein": 35,
                        "carbs": 45,
                        "fats": 25,
                        "fiber": 8
                    }
                },
                {
                    "name": "Green Smoothie Bowl",
                    "description": "A nutrient-dense smoothie bowl topped with fresh fruits, nuts, and seeds. Perfect for a healthy breakfast or post-workout meal.",
                    "ingredients": [
                        "2 cups spinach",
                        "1 frozen banana",
                        "1 cup almond milk",
                        "1 tbsp chia seeds",
                        "1 tbsp almond butter",
                        "Toppings: berries, granola, coconut flakes"
                    ],
                    "benefits": [
                        "Rich in antioxidants",
                        "Supports immune system",
                        "High in fiber",
                        "Natural energy booster"
                    ],
                    "tags": {
                        "dietary_preferences": ["Vegan", "Vegetarian", "Gluten-Free"],
                        "health_goal": [
                            {"main": "Immunity Boosting", "sub": ["Antioxidant-Rich"]},
                            {"main": "Digestive Health", "sub": ["High-Fiber"]}
                        ],
                        "cultural": {"main": "Fusion", "sub": "Modern"}
                    },
                    "nutritional_info": {
                        "calories": 350,
                        "protein": 12,
                        "carbs": 45,
                        "fats": 15,
                        "fiber": 10
                    }
                }
            ]
        
        # Score each recipe based on user preferences and meal analysis
        scored_recipes = []
        for recipe in all_recipes:
            score = 0
            recipe_tags = recipe.get('tags', {})
            
            # Score based on dietary preferences
            recipe_dietary = recipe_tags.get('dietary_preferences', [])
            for pref in dietary_preferences:
                if pref in recipe_dietary:
                    score += 2
            
            # Score based on health goals
            recipe_health_goals = recipe_tags.get('health_goal', [])
            for goal in health_goals:
                if any(goal in health_goal.get('main', '') for health_goal in recipe_health_goals):
                    score += 2
            
            # Score based on cultural preferences
            recipe_cultural = recipe_tags.get('cultural', {})
            if cultural_preferences and recipe_cultural.get('sub') in cultural_preferences:
                score += 1
            
            # Score based on meal analysis
            recipe_nutrition = recipe.get('nutritional_info', {})
            
            # If meal is high in carbs, prefer lower carb recipes
            if meal_macros.get('carbs', 0) > 50:
                if recipe_nutrition.get('carbs', 0) < 30:
                    score += 1
            
            # If meal is low in protein, prefer high protein recipes
            if meal_macros.get('protein', 0) < 20:
                if recipe_nutrition.get('protein', 0) > 20:
                    score += 1
            
            # If meal has low fiber, prefer high fiber recipes
            if meal_macros.get('fiber', 0) < 5:
                if recipe_nutrition.get('fiber', 0) > 5:
                    score += 1
            
            # Add recipe with its score
            scored_recipes.append({
                'recipe': recipe,
                'score': score
            })
        
        # Sort recipes by score and get top 3
        scored_recipes.sort(key=lambda x: x['score'], reverse=True)
        top_recipes = [item['recipe'] for item in scored_recipes[:3]]
        
        # Format recipes for response
        formatted_recipes = []
        for recipe in top_recipes:
            # Ensure benefits is a list
            benefits = recipe.get('benefits', [])
            if isinstance(benefits, str):
                benefits = [benefits]
            elif not isinstance(benefits, list):
                benefits = []
                
            formatted_recipe = {
                'name': recipe.get('name', ''),
                'description': recipe.get('description', ''),
                'ingredients': recipe.get('ingredients', []),
                'benefits': benefits
            }
            formatted_recipes.append(formatted_recipe)
        
        logger.info(f"Returning {len(formatted_recipes)} personalized recipes")
        return {"recipes": formatted_recipes}

    except Exception as e:
        logger.error(f"Error in get_recipe_recommendations: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-profile")
async def analyze_profile(
    user_profile: dict,
    previous_profile: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Analyze user profile changes and update nutritional needs
    """
    try:
        # Get GPT response
        response = query_gpt(f"""
        Analyze the following profile changes and provide updated nutritional recommendations.
        Previous Profile:
        {json.dumps(previous_profile, indent=2)}
        
        New Profile:
        {json.dumps(user_profile, indent=2)}
        
        Please provide ONLY the JSON response with nutritional needs in the following format:
        {{
            "calories": {{
                "min": <integer>,
                "max": <integer>
            }},
            "macros": {{
                "protein": {{
                    "min": <integer>,
                    "max": <integer>,
                    "unit": "g"
                }},
                "carbs": {{
                    "min": <integer>,
                    "max": <integer>,
                    "unit": "g"
                }},
                "fats": {{
                    "min": <integer>,
                    "max": <integer>,
                    "unit": "g"
                }}
            }},
            "other_nutrients": {{
                "fiber": {{
                    "min": <integer>,
                    "max": <integer>,
                    "unit": "g"
                }},
                "sugar": {{
                    "min": <integer>,
                    "max": <integer>,
                    "unit": "g"
                }},
                "sodium": {{
                    "min": <integer>,
                    "max": <integer>,
                    "unit": "mg"
                }}
            }}
        }}
        """)
        
        # Extract JSON from response
        try:
            # Clean up the response by removing markdown code block markers and any text before the JSON
            content = response.strip()
            if "```json" in content:
                content = content.split("```json")[1]
            if "```" in content:
                content = content.split("```")[0]
            content = content.strip()
            
            # Look for JSON-like structure between curly braces
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                nutritional_needs = json.loads(json_str)
            else:
                raise ValueError("No JSON structure found in response")
                
            # Validate the response structure
            required_fields = ["calories", "macros", "other_nutrients"]
            required_macros = ["protein", "carbs", "fats"]
            required_nutrients = ["fiber", "sugar", "sodium"]
            
            for field in required_fields:
                if field not in nutritional_needs:
                    raise ValueError(f"Missing required field: {field}")
            
            for macro in required_macros:
                if macro not in nutritional_needs["macros"]:
                    raise ValueError(f"Missing required macro: {macro}")
            
            for nutrient in required_nutrients:
                if nutrient not in nutritional_needs["other_nutrients"]:
                    raise ValueError(f"Missing required nutrient: {nutrient}")
            
            # Ensure all numeric values are integers
            nutritional_needs["calories"]["min"] = int(nutritional_needs["calories"]["min"])
            nutritional_needs["calories"]["max"] = int(nutritional_needs["calories"]["max"])
            
            for macro in required_macros:
                nutritional_needs["macros"][macro]["min"] = int(nutritional_needs["macros"][macro]["min"])
                nutritional_needs["macros"][macro]["max"] = int(nutritional_needs["macros"][macro]["max"])
            
            for nutrient in required_nutrients:
                nutritional_needs["other_nutrients"][nutrient]["min"] = int(nutritional_needs["other_nutrients"][nutrient]["min"])
                nutritional_needs["other_nutrients"][nutrient]["max"] = int(nutritional_needs["other_nutrients"][nutrient]["max"])
            
            return {"nutritional_needs": nutritional_needs}
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing GPT response: {str(e)}")
            logger.error(f"Raw GPT response: {response}")
            raise HTTPException(status_code=500, detail=f"Failed to parse GPT response: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error analyzing profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))