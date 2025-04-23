from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from datetime import datetime
from bson import ObjectId
from ..models import Supplement, User
from ..routes.database import get_database
from ..auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[Supplement])
async def get_supplements(
    date: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        # If no date provided, get today's supplements
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
            
        # Get supplements for the specified date
        supplements = list(await db.supplements.find({
            "user_id": ObjectId(current_user.id),
            "date": date
        }).to_list(length=None))
        
        # Convert ObjectId to string for JSON serialization
        for supplement in supplements:
            supplement["id"] = str(supplement.pop("_id"))
            supplement["user_id"] = str(supplement["user_id"])
        
        return supplements
    except Exception as e:
        logger.error(f"Error fetching supplements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Supplement)
async def create_supplement(
    supplement_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        # Create new supplement document
        new_supplement = {
            "user_id": ObjectId(current_user.id),  # Store as ObjectId in database
            "name": supplement_data.get("name"),
            "dose": supplement_data.get("dose"),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into database
        result = await db.supplements.insert_one(new_supplement)
        
        # Get the inserted supplement
        saved_supplement = await db.supplements.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string for JSON serialization
        saved_supplement["id"] = str(saved_supplement.pop("_id"))
        saved_supplement["user_id"] = str(saved_supplement["user_id"])
        
        # Convert datetime objects to ISO format strings
        saved_supplement["created_at"] = saved_supplement["created_at"].isoformat()
        saved_supplement["updated_at"] = saved_supplement["updated_at"].isoformat()
        
        return Supplement(**saved_supplement)
    except Exception as e:
        logger.error(f"Error creating supplement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{supplement_id}")
async def delete_supplement(
    supplement_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        if not supplement_id:
            raise HTTPException(status_code=400, detail="Supplement ID is required")
            
        # Try to parse as ObjectId first
        try:
            # Delete supplement if it belongs to the current user
            result = await db.supplements.delete_one({
                "_id": ObjectId(supplement_id),
                "user_id": ObjectId(current_user.id)
            })
            
            if result.deleted_count > 0:
                return {"message": "Supplement deleted successfully"}
        except Exception:
            # If ObjectId parsing fails, try to parse as composite ID
            try:
                # Split the composite ID into parts
                parts = supplement_id.split('-')
                if len(parts) < 3:
                    raise ValueError("Invalid composite ID format")
                    
                user_id = parts[0]
                name = parts[1]
                dose = parts[2]
                
                # Delete supplement using composite ID parts
                result = await db.supplements.delete_one({
                    "user_id": ObjectId(user_id),
                    "name": name,
                    "dose": dose
                })
                
                if result.deleted_count > 0:
                    return {"message": "Supplement deleted successfully"}
                else:
                    raise HTTPException(status_code=404, detail="Supplement not found")
            except Exception as e:
                logger.error(f"Error deleting supplement with composite ID: {str(e)}")
                raise HTTPException(status_code=404, detail="Supplement not found")
            
        raise HTTPException(status_code=404, detail="Supplement not found")
    except Exception as e:
        logger.error(f"Error deleting supplement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 