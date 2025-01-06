from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI")  # Load from environment variables for security

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client["ByteBotDB"]

# Collections
user_profiles = db["user_profiles"]
recipes = db["recipes"]
