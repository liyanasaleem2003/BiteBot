from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends
from typing import AsyncGenerator
import os
from dotenv import load_dotenv
import logging
import asyncio
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

# Database connection settings
MAX_POOL_SIZE = 100
MIN_POOL_SIZE = 10
MAX_IDLE_TIME_MS = 45000  # 45 seconds
CONNECT_TIMEOUT_MS = 5000  # 5 seconds
RETRY_WRITES = True
RETRY_READS = True
RECONNECT_INTERVAL = 5  # seconds

class DatabaseManager:
    _instance = None
    _client = None
    _db = None
    _connection_task = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
        return cls._instance

    async def connect(self):
        """Establish database connection with retry mechanism"""
        try:
            if self._client is None:
                logger.info("Initializing MongoDB connection...")
                self._client = AsyncIOMotorClient(
                    MONGODB_URL,
                    maxPoolSize=MAX_POOL_SIZE,
                    minPoolSize=MIN_POOL_SIZE,
                    maxIdleTimeMS=MAX_IDLE_TIME_MS,
                    connectTimeoutMS=CONNECT_TIMEOUT_MS,
                    retryWrites=RETRY_WRITES,
                    retryReads=RETRY_READS,
                    serverSelectionTimeoutMS=5000
                )
                
                # Test the connection
                await self._client.admin.command('ping')
                self._db = self._client.bitebot
                logger.info("Successfully connected to MongoDB")
                
                # Start the connection monitoring task
                if self._connection_task is None:
                    self._connection_task = asyncio.create_task(self._monitor_connection())
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    async def _monitor_connection(self):
        """Monitor and maintain database connection"""
        while True:
            try:
                # Ping the database to check connection
                await self._client.admin.command('ping')
                await asyncio.sleep(RECONNECT_INTERVAL)
            except Exception as e:
                logger.error(f"Database connection lost: {str(e)}")
                try:
                    await self.connect()
                except Exception as reconnect_error:
                    logger.error(f"Failed to reconnect to database: {str(reconnect_error)}")
                await asyncio.sleep(RECONNECT_INTERVAL)

    async def get_db(self):
        """Get database instance"""
        if self._db is None:
            await self.connect()
        return self._db

    async def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
        if self._connection_task:
            self._connection_task.cancel()
            self._connection_task = None

# Create global database manager instance
db_manager = DatabaseManager()

async def get_database():
    """Dependency for getting database instance"""
    try:
        db = await db_manager.get_db()
        yield db
    except Exception as e:
        logger.error(f"Error getting database instance: {str(e)}")
        raise

# Custom JSON encoder for datetime objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, (int, float)):
            return obj
        return super().default(obj) 