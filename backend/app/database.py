from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))  # Add your MongoDB URI in .env
db = client.bitebot_db
users_collection = db["users"]
