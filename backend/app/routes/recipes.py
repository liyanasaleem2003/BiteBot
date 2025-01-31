from fastapi import APIRouter, HTTPException
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
router = APIRouter()
MONGO_URI = os.getenv("MONGO_URI")
# MongoDB connection (adjust as per your setup)
client = MongoClient(MONGO_URI)
db = client["BiteBotDB"]  # Replace 'bitebot' with your database name
recipes_collection = db["recipes"]

@router.get("/recipes")
async def get_recipes():
    recipes = list(recipes_collection.find({}, {"_id": 0}))  # Exclude MongoDB's `_id` field
    return recipes


@router.post("/favorites")
async def add_to_favorites(user_id: str, recipe_id: str):
    """
    Add a recipe to the user's favorites.
    """
    try:
        user = await db["users"].find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update user's favorite recipes
        await db["users"].update_one(
            {"_id": user_id},
            {"$addToSet": {"favorites": recipe_id}}  # Ensure no duplicates
        )
        return {"message": "Recipe added to favorites"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
