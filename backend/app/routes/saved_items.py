from fastapi import APIRouter, HTTPException, Depends, Body
from app.routes.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models import SavedRecipe, User
from bson import ObjectId
from typing import List, Dict, Any
import logging
from app.auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Saved Recipes Routes
@router.get("/recipes", response_model=List[Dict[str, Any]])
async def get_saved_recipes(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    try:
        user_id = ObjectId(current_user.id)
        recipes_cursor = db.saved_recipes.find({"user_id": user_id})
        recipes = await recipes_cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        formatted_recipes = []
        for recipe in recipes:
            formatted_recipe = {
                "id": str(recipe["_id"]),
                "user_id": str(recipe["user_id"]),
                "recipe_id": recipe["recipe_id"],
                "title": recipe["title"],
                "image": recipe["image"],
                "timeInMinutes": recipe.get("timeInMinutes"),
                "spiceLevel": recipe.get("spiceLevel"),
                "pricePerPortion": recipe.get("pricePerPortion"),
                "nutrition": recipe.get("nutrition", {}),
                "tags": recipe.get("tags", {}),
                "healthBenefits": recipe.get("healthBenefits", []),
                "dietaryPreference": recipe.get("dietaryPreference", []),
                "mealType": recipe.get("mealType"),
                "culturalStyle": recipe.get("culturalStyle"),
                "mealPreference": recipe.get("mealPreference"),
                "introduction": recipe.get("introduction"),
                "ingredients": recipe.get("ingredients", []),
                "instructions": recipe.get("instructions", [])
            }
            formatted_recipes.append(formatted_recipe)
        
        return formatted_recipes
    except Exception as e:
        logger.error(f"Error fetching saved recipes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recipes", response_model=Dict[str, Any])
async def save_recipe(
    recipe: Dict[str, Any] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    try:
        user_id = ObjectId(current_user.id)
        
        # Create new recipe document
        new_recipe = {
            "user_id": user_id,
            "recipe_id": recipe["recipe_id"],
            "title": recipe["title"],
            "image": recipe.get("image") or "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80",  # Use original image or fallback
            "timeInMinutes": recipe.get("timeInMinutes"),
            "spiceLevel": recipe.get("spiceLevel"),
            "pricePerPortion": recipe.get("pricePerPortion"),
            "nutrition": recipe.get("nutrition", {}),
            "tags": recipe.get("tags", {}),
            "healthBenefits": recipe.get("healthBenefits", []),
            "dietaryPreference": recipe.get("dietaryPreference", []),
            "mealType": recipe.get("mealType"),
            "culturalStyle": recipe.get("culturalStyle"),
            "mealPreference": recipe.get("mealPreference"),
            "introduction": recipe.get("introduction"),
            "ingredients": recipe.get("ingredients", []),
            "instructions": recipe.get("instructions", []),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        logger.info(f"New recipe object: {new_recipe}")
        
        result = await db.saved_recipes.insert_one(new_recipe)
        logger.info(f"Insert result: {result.inserted_id}")
        
        # Return the saved recipe with string IDs
        return {
            "id": str(result.inserted_id),
            "user_id": str(user_id),
            **{k: v for k, v in new_recipe.items() if k not in ["_id", "user_id"]}
        }
    except Exception as e:
        logger.error(f"Error saving recipe: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/recipes/{recipe_id}")
async def delete_saved_recipe(
    recipe_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user)
):
    try:
        logger.info(f"Attempting to delete recipe with ID: {recipe_id}")
        logger.info(f"Current user ID: {current_user.id}")
        
        user_id = ObjectId(current_user.id)
        logger.info(f"Converted user_id to ObjectId: {user_id}")
        
        # Log the query we're about to execute
        query = {
            "user_id": user_id,
            "recipe_id": recipe_id
        }
        logger.info(f"Delete query: {query}")
        
        # First check if the recipe exists
        existing_recipe = await db.saved_recipes.find_one(query)
        if not existing_recipe:
            logger.error(f"Recipe not found with query: {query}")
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        logger.info(f"Found recipe to delete: {existing_recipe}")
        
        result = await db.saved_recipes.delete_one(query)
        logger.info(f"Delete result: {result.raw_result}")
        
        if result.deleted_count == 0:
            logger.error("Delete operation reported no deletions")
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        logger.info("Recipe deleted successfully")
        return {"message": "Recipe deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting saved recipe: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e)) 