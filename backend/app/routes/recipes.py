from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection (adjust as per your setup)
MONGO_URI = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URI)
db = client["bitebot"]  # Replace 'bitebot' with your database name
recipes_collection = db["recipes"]


@router.get("/recipes")
async def get_recipes():
    """
    Fetch all recipes from MongoDB.
    """
    try:
        recipes = await recipes_collection.find().to_list(length=100)  # Limit to 100 recipes
        return recipes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
