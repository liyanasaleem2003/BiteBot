from fastapi import APIRouter, HTTPException, Query, Depends
from app.routes.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
import os

router = APIRouter()

# Get the API base URL from environment variable or use default
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')

@router.get("", response_model=list)
async def get_recipes(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # Sort by recipe_id (assuming recipe_id is a string and should be sorted numerically)
        recipes_cursor = db.recipes.find({}, {"_id": 0}).sort("recipe_id", 1)
        recipes = await recipes_cursor.to_list(length=None)

        formatted_recipes = []
        for recipe in recipes:
            # Construct the full image URL using the API base URL
            image_url = f"{API_BASE_URL}/static/recipes/{recipe['recipe_id']}.jpg" if recipe.get("recipe_id") else None
            
            formatted_recipe = {
                "recipe_id": recipe["recipe_id"],
                "title": recipe["name"],
                "image": image_url,
                "timeInMinutes": recipe["time_required"],
                "spiceLevel": min(3, recipe["spice_level"].count("🌶️")) if recipe.get("spice_level") else 0,
                "pricePerPortion": recipe.get("approx_price_per_portion", 0),
                "nutrition": {
                    "calories": recipe["nutritional_info"].get("calories", 0),
                    "protein": recipe["nutritional_info"].get("protein", 0),
                    "carbs": recipe["nutritional_info"].get("carbs", 0),
                    "fat": recipe["nutritional_info"].get("fat", 0),
                    "fiber": recipe["nutritional_info"].get("fiber", 0)
                },
                # Add tags structure for filtering
                "tags": {
                    "dietary_preferences": recipe["tags"].get("dietary_preferences", []),
                    "health_goal": recipe["tags"].get("health_goal", []),
                    "meal_type": recipe["tags"].get("meal_type"),
                    "cultural": recipe["tags"].get("cultural", {}),
                    "meal_preference": recipe["tags"].get("meal_preference")
                },
                # Add these fields for search functionality
                "healthBenefits": [
                    sub for goal in recipe["tags"].get("health_goal", []) 
                    for sub in goal.get("sub", [])
                ],
                "dietaryPreference": recipe["tags"].get("dietary_preferences", []),
                "mealType": recipe["tags"].get("meal_type"),
                "culturalStyle": (
                    "Fusion" if recipe["tags"].get("cultural", {}).get("main") == "Fusion 🥘"
                    else "Authentic"
                ),
                "mealPreference": recipe["tags"].get("meal_preference"),
                # Add new fields for expanded view
                "introduction": recipe.get("introduction", ""),
                "ingredients": recipe.get("ingredients", []),
                "instructions": recipe.get("instructions", [])
            }
            formatted_recipes.append(formatted_recipe)

        return formatted_recipes

    except Exception as e:
        logging.error(f"Error in get_recipes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
