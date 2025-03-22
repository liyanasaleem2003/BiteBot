from fastapi import APIRouter, HTTPException, Query
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
router = APIRouter()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["BiteBotDB"]
recipes_collection = db["recipes"]
import logging

@router.get("", response_model=list)  # Remove "/" to avoid duplicate prefix issue
async def get_recipes():
    try:
        # Sort by recipe_id (assuming recipe_id is a string and should be sorted numerically)
        recipes = list(recipes_collection.find({}, {"_id": 0}).sort("recipe_id", 1))  

        formatted_recipes = []
        for recipe in recipes:
            formatted_recipe = {
                "title": recipe["name"],
               "image": f"http://localhost:8000{recipe['image_url']}" if recipe.get("image_url") else None,
                "timeInMinutes": recipe["time_required"],
                "spiceLevel": min(3, recipe["spice_level"].count("🌶️")) if recipe.get("spice_level") else 0,

                "pricePerPortion": recipe.get("approx_price_per_portion", 0),  # Handle missing price
                "nutrition": {
                    "calories": recipe["nutritional_info"].get("calories", 0),
                    "protein": recipe["nutritional_info"].get("protein", 0),
                    "carbs": recipe["nutritional_info"].get("carbs", 0),
                    "fat": recipe["nutritional_info"].get("fat", 0),
                    "fiber": recipe["nutritional_info"].get("fiber", 0)
                },
                "healthBenefits": [
                    sub for goal in recipe["tags"].get("health_goal", []) for sub in goal.get("sub", [])
                ],
                "culturalStyle": (
                    "Fusion" if recipe["tags"]["cultural"]["main"] == "Fusion 🥘"
                    else recipe["tags"]["cultural"].get("sub", "Authentic")
                )
            }
            formatted_recipes.append(formatted_recipe)

        return formatted_recipes

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
