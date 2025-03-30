from fastapi import FastAPI, HTTPException
from app.routes import profile, chatbot, recipes, auth, nutrition, database, shopping_list
from fastapi.middleware.cors import CORSMiddleware
from app import wellness
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
import os
import logging
from .database import db_manager
from bson import ObjectId
import io
from app.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Exposes all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

try:
    recipes_path = os.path.abspath("app/recipes")
    if not os.path.exists(recipes_path):
        logger.warning(f"Recipes directory not found at {recipes_path}")
        os.makedirs(recipes_path)
    
    app.mount("/recipes", StaticFiles(directory=recipes_path), name="recipes")
except Exception as e:
    logger.error(f"Failed to mount recipes directory: {str(e)}")

# Include routes
try:
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(profile.router, prefix="/auth", tags=["profile"])
    app.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
    app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
    app.include_router(nutrition.router, prefix="/nutrition", tags=["nutrition"])
    app.include_router(database.router, prefix="/database", tags=["database"])
    app.include_router(shopping_list.router, prefix="/shopping-list", tags=["shopping-list"])
    logger.info("Successfully included all routers")
except Exception as e:
    logger.error(f"Failed to include routers: {str(e)}")
    raise HTTPException(status_code=500, detail="Failed to initialize application routes")

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await db_manager.connect()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database connection: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up database connection on shutdown"""
    try:
        await db_manager.close()
        logger.info("Application shutdown completed successfully")
    except Exception as e:
        logger.error(f"Error during application shutdown: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to BiteBot API"}

# Add route to serve stored images
@app.get("/images/{image_id}")
async def get_image(image_id: str):
    try:
        db = await db_manager.get_db()
        image = await db.images.find_one({"_id": ObjectId(image_id)})
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return StreamingResponse(
            content=io.BytesIO(image["data"]),
            media_type=image["content_type"]
        )
    except Exception as e:
        logger.error(f"Error serving image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to serve image")
