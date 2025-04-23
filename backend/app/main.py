from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import auth, profile, chatbot, nutrition, saved_items, recipes, shopping_list, chat, supplements
from app.database import DatabaseManager
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Mount the recipes folder as a static directory
recipes_path = os.path.join(os.path.dirname(__file__), "recipes")
app.mount("/static/recipes", StaticFiles(directory=recipes_path), name="recipes")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(saved_items.router, prefix="/api/saved", tags=["saved"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(shopping_list.router, prefix="/api/shopping-list", tags=["shopping-list"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(supplements.router, prefix="/api/supplements", tags=["supplements"])

# Create a database manager instance
db_manager = DatabaseManager()

@app.on_event("startup")
async def startup_db_client():
    try:
        await db_manager.connect()
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise e

@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        await db_manager.close()
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Error disconnecting from MongoDB: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to BiteBot API"}
