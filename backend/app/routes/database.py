from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends, HTTPException, APIRouter
from typing import AsyncGenerator
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import json
from app.utils.json_utils import json_dumps
from ..config import settings
import asyncio
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get MongoDB URL from environment variables
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set")

router = APIRouter()

# Global client instance
client = None

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, (int, float)):
            return obj
        return super().default(obj)

class FallbackDB:
    def __init__(self):
        self.user_profiles = FallbackCollection()
        self.meals = FallbackCollection()
        self.recipes = FallbackCollection()
        self.favorites = FallbackCollection()

class FallbackCollection:
    async def find_one(self, *args, **kwargs):
        return None

    async def find(self, *args, **kwargs):
        return []

    async def insert_one(self, *args, **kwargs):
        return None

    async def update_one(self, *args, **kwargs):
        return None

    async def delete_one(self, *args, **kwargs):
        return None

def with_retry(max_retries=3, delay=2):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Failed after {max_retries} attempts: {str(e)}")
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                    await asyncio.sleep(delay)
            return None
        return wrapper
    return decorator

@with_retry(max_retries=3, delay=2)
async def get_database():
    global client
    try:
        if client is None:
            logger.info("Creating new MongoDB connection")
            client = AsyncIOMotorClient(settings.MONGODB_URL)
            
        # Test the connection
        await client.admin.command('ping')
        logger.info("MongoDB connection successful")
        
        return client[settings.MONGODB_DB_NAME]
    except Exception as e:
        logger.error(f"MongoDB connection error: {str(e)}")
        if client:
            client.close()
            client = None
        raise

@router.get("/health")
async def health_check():
    try:
        if client is None:
            client = AsyncIOMotorClient(MONGODB_URL)
        
        # Test the connection
        await client.admin.command('ping')
        return {"status": "healthy", "message": "Database connection is working"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database health check failed: {str(e)}"
        )

# Example usage of the decorator
@with_retry(max_retries=3, delay=2)
async def get_db():
    return await get_database()
