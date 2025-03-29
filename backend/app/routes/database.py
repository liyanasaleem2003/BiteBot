from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends, HTTPException, APIRouter
from typing import AsyncGenerator
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import json
from app.utils.json_utils import json_dumps

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get MongoDB URL from environment variables
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set")

router = APIRouter()

# Database connection
client = None
db = None

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

async def get_database():
    global client, db
    try:
        if client is None:
            logger.info(f"Connecting to database: {MONGODB_URL}")
            client = AsyncIOMotorClient(MONGODB_URL)
            db = client.BiteBotDB
            
            # Test the connection
            await db.command("ping")
            logger.info("Successfully connected to MongoDB")
        
        yield db
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        )
    finally:
        if client:
            logger.info("MongoDB connection closed")
            client.close()
            client = None
            db = None

@router.get("/health")
async def health_check():
    try:
        if client is None:
            client = AsyncIOMotorClient(MONGODB_URL)
            db = client.BiteBotDB
        
        # Test the connection
        await db.command("ping")
        return {"status": "healthy", "message": "Database connection is working"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database health check failed: {str(e)}"
        )
