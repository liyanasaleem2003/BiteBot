from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
# MongoDB connection (adjust as per your setup)
client = MongoClient(MONGO_URI)
db = client["BiteBotDB"]
recipes = db["recipes"]
print(list(recipes.find({})))
