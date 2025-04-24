from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, List, Optional
from datetime import datetime
from ..models import User
from ..auth import get_current_user
from .database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging
from ..utils.json_utils import json_dumps, json_loads

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
@router.get("/history")
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all chat history for the current user"""
    try:
        chats = await db.chat_history.find(
            {"user_id": ObjectId(current_user.id)}
        ).sort("timestamp", -1).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization and deduplicate entries
        processed_chats = []
        seen_entries = set()  # Track unique title+date combinations
        
        for chat in chats:
            chat["id"] = str(chat["_id"])
            del chat["_id"]
            
            # Create a unique key based on title and date
            chat_date = chat.get("timestamp", datetime.utcnow()).strftime("%Y-%m-%d %H:%M") if isinstance(chat.get("timestamp"), datetime) else "unknown"
            unique_key = f"{chat.get('title', 'Untitled')}-{chat_date}"
            
            # Only add this chat if we haven't seen this title+date combination before
            if unique_key not in seen_entries:
                seen_entries.add(unique_key)
                processed_chats.append(chat)
        
        # Use enhanced JSON serialization utility
        return {"data": json_loads(json_dumps(processed_chats))}
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chat history: {str(e)}"
        )

@router.post("/history")
async def create_chat_history(
    chat_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new chat history entry"""
    try:
        now = datetime.utcnow()
        chat_dict = {
            "user_id": ObjectId(current_user.id),
            "title": chat_data.get("title", "New Chat"),
            "timestamp": now,
            "image_url": chat_data.get("image_url"),
            "messages": chat_data.get("messages", []),
            "meal_analysis": chat_data.get("meal_analysis"),
            "created_at": now,
            "updated_at": now
        }
        
        result = await db.chat_history.insert_one(chat_dict)
        
        # Get the created chat
        created_chat = await db.chat_history.find_one({"_id": result.inserted_id})
        if not created_chat:
            raise HTTPException(
                status_code=500,
                detail="Failed to create chat history"
            )
        
        # Use enhanced JSON serialization utility
        return {"data": json_loads(json_dumps(created_chat))}
    except Exception as e:
        logger.error(f"Error creating chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create chat history: {str(e)}"
        )

@router.put("/history/{chat_id}")
async def update_chat_history(
    chat_id: str,
    chat_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an existing chat history entry"""
    try:
        # Verify chat belongs to user
        chat = await db.chat_history.find_one({
            "_id": ObjectId(chat_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat history not found"
            )
        
        # Update chat
        update_data = {
            "title": chat_data.get("title", chat.get("title", "Chat")),
            "messages": chat_data.get("messages", chat["messages"]),
            "meal_analysis": chat_data.get("meal_analysis", chat["meal_analysis"]),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.chat_history.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to update chat history"
            )
        
        # Get the updated chat
        updated_chat = await db.chat_history.find_one({"_id": ObjectId(chat_id)})
        
        # Use enhanced JSON serialization utility
        return {"data": json_loads(json_dumps(updated_chat))}
    except Exception as e:
        logger.error(f"Error updating chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update chat history: {str(e)}"
        ) 

@router.delete("/history/{chat_id}")
async def delete_chat_history(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a chat history entry"""
    try:
        # Validate ObjectId format
        try:
            chat_id_obj = ObjectId(chat_id)
            user_id_obj = ObjectId(current_user.id)
        except Exception as e:
            logger.error(f"Invalid ObjectId format: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid ID format: {str(e)}"
            )
            
        # Check if the chat history collection exists
        if 'chat_history' not in await db.list_collection_names():
            logger.error("Chat history collection does not exist")
            raise HTTPException(
                status_code=404,
                detail="Chat history collection not found"
            )
            
        # Check if the chat exists and belongs to the user
        chat = await db.chat_history.find_one({
            "_id": chat_id_obj,
            "user_id": user_id_obj
        })
        
        if not chat:
            logger.error(f"Chat not found or user doesn't have permission. Chat ID: {chat_id}, User ID: {current_user.id}")
            raise HTTPException(
                status_code=404,
                detail="Chat history not found or you don't have permission to delete it"
            )
        
        # Delete the chat
        result = await db.chat_history.delete_one({
            "_id": chat_id_obj,
            "user_id": user_id_obj
        })
        
        if result.deleted_count == 0:
            logger.error(f"Failed to delete chat. Chat ID: {chat_id}, User ID: {current_user.id}")
            raise HTTPException(
                status_code=404,
                detail="Failed to delete chat history"
            )
        
        logger.info(f"Chat history deleted successfully. Chat ID: {chat_id}, User ID: {current_user.id}")
        return {"message": "Chat history deleted successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error deleting chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete chat history: {str(e)}"
        )