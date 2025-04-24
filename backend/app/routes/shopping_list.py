from fastapi import APIRouter, HTTPException, Depends, Body
from app.routes.database import get_database
from app.auth import get_current_user
from app.models import User
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
from typing import List
from pydantic import BaseModel

# Add request model
class ShoppingListUpdate(BaseModel):
    ingredients: List[str]

router = APIRouter()

@router.get("")
async def get_shopping_list(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        # Check if shopping_lists collection exists
        collections = await db.list_collection_names()
        if 'shopping_lists' not in collections:
            # Create the collection if it doesn't exist
            await db.create_collection('shopping_lists')
            return []
            
        shopping_list = await db.shopping_lists.find_one({"user_id": current_user.id})
        if not shopping_list:
            # Create a new shopping list if it doesn't exist
            await db.shopping_lists.insert_one({
                "user_id": current_user.id,
                "ingredients": []
            })
            return []
        
        return shopping_list.get("ingredients", [])
    except Exception as e:
        logging.error(f"Error in get_shopping_list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def update_shopping_list(
    update: ShoppingListUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        logging.info(f"Received shopping list update request: {update}")
        
        # Remove duplicates from ingredients
        unique_ingredients = list(dict.fromkeys(update.ingredients))
        logging.info(f"Unique ingredients: {unique_ingredients}")
        
        # Check if shopping_lists collection exists
        collections = await db.list_collection_names()
        if 'shopping_lists' not in collections:
            # Create the collection if it doesn't exist
            await db.create_collection('shopping_lists')
        
        result = await db.shopping_lists.update_one(
            {"user_id": current_user.id},
            {"$set": {"ingredients": unique_ingredients}},
            upsert=True
        )
        
        if result.modified_count == 0 and not result.upserted_id:
            raise HTTPException(status_code=404, detail="Shopping list not found")
        
        return {"message": "Shopping list updated successfully", "ingredients": unique_ingredients}
    except Exception as e:
        logging.error(f"Error in update_shopping_list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("")
async def clear_shopping_list(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        # Check if shopping_lists collection exists
        collections = await db.list_collection_names()
        if 'shopping_lists' not in collections:
            # Create the collection if it doesn't exist
            await db.create_collection('shopping_lists')
            return {"message": "Shopping list cleared successfully"}
        
        result = await db.shopping_lists.update_one(
            {"user_id": current_user.id},
            {"$set": {"ingredients": []}}
        )
        
        if result.modified_count == 0:
            # If shopping list doesn't exist, create it with empty ingredients
            await db.shopping_lists.insert_one({
                "user_id": current_user.id,
                "ingredients": []
            })
        
        return {"message": "Shopping list cleared successfully"}
    except Exception as e:
        logging.error(f"Error in clear_shopping_list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 