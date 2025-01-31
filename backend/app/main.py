from fastapi import FastAPI
from app.routes import profile, chatbot, meal_plan
from fastapi.middleware.cors import CORSMiddleware

from backend.app import wellness
from backend.app.routes import auth

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (for images)
app.mount("/recipes", StaticFiles(directory="app/recipes"), name="recipes")

# Include routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(recipes.router, prefix="/recipes", tags=["Recipes"])

@app.get("/")
def read_root():
    return {"message": "Welcome to BiteBot Backend!"}
