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
        user = await db.user_profiles.find_one({"_id": current_user.id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user.get("shopping_list", [])
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
        
        result = await db.user_profiles.update_one(
            {"_id": current_user.id},
            {"$set": {"shopping_list": unique_ingredients}},
            upsert=True
        )
        
        if result.modified_count == 0 and not result.upserted_id:
            raise HTTPException(status_code=404, detail="User not found")
        
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
        result = await db.user_profiles.update_one(
            {"_id": current_user.id},
            {"$set": {"shopping_list": []}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "Shopping list cleared successfully"}
    except Exception as e:
        logging.error(f"Error in clear_shopping_list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 