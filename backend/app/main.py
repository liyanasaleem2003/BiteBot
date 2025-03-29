from fastapi import FastAPI, HTTPException
from app.routes import profile, chatbot, recipes, auth, nutrition, database
from fastapi.middleware.cors import CORSMiddleware
from app import wellness
from fastapi.staticfiles import StaticFiles
import os
import logging

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
    app.include_router(profile.router, prefix="/profile", tags=["profile"])
    app.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
    app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
    app.include_router(nutrition.router, prefix="/nutrition", tags=["nutrition"])
    app.include_router(database.router, prefix="/database", tags=["database"])
    logger.info("Successfully included all routers")
except Exception as e:
    logger.error(f"Failed to include routers: {str(e)}")
    raise HTTPException(status_code=500, detail="Failed to initialize application routes")

@app.get("/")
async def root():
    return {"message": "Welcome to BiteBot Backend!"}

@app.on_event("startup")
async def startup_event():
    logger.info("Successfully included all routers")
